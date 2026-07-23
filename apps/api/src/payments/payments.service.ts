import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Payment, PaymentGateway, PaymentGatewayStatus } from './entities/payment.entity';
import { Order, PaymentMethod, PaymentStatus, OrderStatus } from '../orders/entities/order.entity';
import { EasypaisaService } from './gateways/easypaisa.service';
import { JazzcashService } from './gateways/jazzcash.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    private easypaisaService: EasypaisaService,
    private jazzcashService: JazzcashService,
    private mailService: MailService,
  ) {}

  async initiateEasypaisa(orderId: string, userId: string) {
    const order = await this.getOrderForPayment(orderId, userId);
    const txnRefNo = `EP-${uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase()}`;

    const payment = this.paymentRepo.create({
      orderId,
      gateway: PaymentGateway.EASYPAISA,
      txnRefNo,
      amount: order.totalAmount,
      status: PaymentGatewayStatus.PENDING,
    });
    await this.paymentRepo.save(payment);

    const result = await this.easypaisaService.initiateTransaction({
      orderId,
      txnRefNo,
      amount: order.totalAmount,
    });

    return { redirectUrl: result.redirectUrl, txnRefNo };
  }

  async initiateJazzcash(orderId: string, userId: string) {
    const order = await this.getOrderForPayment(orderId, userId);
    const txnRefNo = `JC-${uuidv4().replace(/-/g, '').substring(0, 16).toUpperCase()}`;

    const payment = this.paymentRepo.create({
      orderId,
      gateway: PaymentGateway.JAZZCASH,
      txnRefNo,
      amount: order.totalAmount,
      status: PaymentGatewayStatus.PENDING,
    });
    await this.paymentRepo.save(payment);

    const formData = this.jazzcashService.buildCheckoutForm({
      orderId,
      txnRefNo,
      amount: order.totalAmount,
      description: `Order #${order.orderNumber}`,
    });

    return { formData, txnRefNo };
  }

  async handleEasypaisaCallback(data: Record<string, string>) {
    this.logger.log('EasyPaisa callback received', JSON.stringify(data));

    const txnRefNo = data['orderRefNum'] || data['txnRefNo'];
    if (!txnRefNo) {
      this.logger.warn('EasyPaisa callback missing txnRefNo');
      return { success: false };
    }

    const payment = await this.paymentRepo.findOne({
      where: { txnRefNo },
      relations: ['order'],
    });
    if (!payment) return { success: false, message: 'Payment not found' };

    const isValid = this.easypaisaService.verifyCallback(data);
    const isSuccess = this.easypaisaService.isSuccessCallback(data);

    payment.gatewayResponse = data as Record<string, unknown>;
    payment.gatewayTxnId = data['transactionId'] || data['txnRefNo'];
    payment.gatewayMessage = data['responseCode'] || '';

    if (isSuccess) {
      payment.status = PaymentGatewayStatus.SUCCESS;
      await this.updateOrderPaymentStatus(payment.orderId, PaymentStatus.PAID, OrderStatus.CONFIRMED);
      await this.mailService.sendOrderConfirmation(payment.order);
    } else {
      payment.status = PaymentGatewayStatus.FAILED;
      await this.updateOrderPaymentStatus(payment.orderId, PaymentStatus.FAILED);
    }

    await this.paymentRepo.save(payment);
    return { success: isSuccess };
  }

  async handleJazzcashCallback(data: Record<string, string>) {
    this.logger.log('JazzCash callback received', JSON.stringify(data));

    const txnRefNo = data['pp_TxnRefNo'];
    if (!txnRefNo) return { success: false };

    const payment = await this.paymentRepo.findOne({
      where: { txnRefNo },
      relations: ['order'],
    });
    if (!payment) return { success: false };

    const isValid = this.jazzcashService.verifyCallback(data);
    const isSuccess = this.jazzcashService.isSuccessCallback(data);

    payment.gatewayResponse = data as Record<string, unknown>;
    payment.gatewayTxnId = this.jazzcashService.getGatewayTxnId(data);
    payment.gatewayMessage = data['pp_ResponseMessage'] || '';

    if (isSuccess) {
      payment.status = PaymentGatewayStatus.SUCCESS;
      await this.updateOrderPaymentStatus(payment.orderId, PaymentStatus.PAID, OrderStatus.CONFIRMED);
      await this.mailService.sendOrderConfirmation(payment.order);
    } else {
      payment.status = PaymentGatewayStatus.FAILED;
      await this.updateOrderPaymentStatus(payment.orderId, PaymentStatus.FAILED);
    }

    await this.paymentRepo.save(payment);
    return { success: isSuccess, orderId: payment.orderId };
  }

  async findAll(page = 1, limit = 20) {
    const [items, total] = await this.paymentRepo.findAndCount({
      relations: ['order'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  private async getOrderForPayment(orderId: string, userId: string) {
    const order = await this.orderRepo.findOne({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentStatus === PaymentStatus.PAID)
      throw new BadRequestException('Order already paid');
    return order;
  }

  private async updateOrderPaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
    orderStatus?: OrderStatus,
  ) {
    const updates: Partial<Order> = { paymentStatus };
    if (orderStatus) updates.status = orderStatus;
    await this.orderRepo.update({ id: orderId }, updates);
  }
}
