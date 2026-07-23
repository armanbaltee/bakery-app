import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { Order } from '../orders/entities/order.entity';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private mailerService: MailerService) {}

  async sendOrderConfirmation(order: Order): Promise<void> {
    if (!order?.user?.email) {
      this.logger.warn(`Cannot send email: order ${order?.id} has no user email`);
      return;
    }

    try {
      await this.mailerService.sendMail({
        to: order.user.email,
        subject: `Order Confirmed – ${order.orderNumber} 🎂`,
        template: './order-confirmation',
        context: {
          name: order.user.name,
          orderNumber: order.orderNumber,
          items: order.items,
          subtotal: order.subtotal,
          deliveryCharge: order.deliveryCharge,
          totalAmount: order.totalAmount,
          deliveryAddress: order.deliveryAddress,
          orderStatus: order.status,
          year: new Date().getFullYear(),
        },
      });
      this.logger.log(`Order confirmation email sent to ${order.user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send order confirmation email: ${error.message}`);
    }
  }
}
