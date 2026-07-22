import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, PaymentStatus, PaymentMethod } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private itemRepo: Repository<OrderItem>,
    @InjectRepository(Cart) private cartRepo: Repository<Cart>,
  ) {}

  async create(userId: string, dto: CreateOrderDto): Promise<Order> {
    const cart = await this.cartRepo.findOne({
      where: { userId },
      relations: ['items', 'items.product', 'items.product.images'],
    });

    if (!cart || !cart.items.length) {
      throw new BadRequestException('Cart is empty');
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.unitPrice) * item.quantity,
      0,
    );
    const deliveryCharge = 150; // flat delivery charge PKR 150
    const totalAmount = subtotal + deliveryCharge;

    const orderNumber = await this.generateOrderNumber();

    const order = this.orderRepo.create({
      userId,
      orderNumber,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: dto.paymentMethod as PaymentMethod,
      subtotal,
      deliveryCharge,
      totalAmount,
      deliveryAddress: dto.deliveryAddress,
      notes: dto.notes,
    });

    const saved = await this.orderRepo.save(order);

    // Create order items from cart
    const orderItems = cart.items.map((cartItem) => {
      const primaryImage = cartItem.product.images?.find((i) => i.isPrimary);
      return this.itemRepo.create({
        orderId: saved.id,
        productId: cartItem.productId,
        productName: cartItem.product.name,
        productSlug: cartItem.product.slug,
        productImageUrl: primaryImage?.url || cartItem.product.images?.[0]?.url,
        quantity: cartItem.quantity,
        unitPrice: cartItem.unitPrice,
        totalPrice: Number(cartItem.unitPrice) * cartItem.quantity,
        customizations: cartItem.customizations,
      });
    });

    await this.itemRepo.save(orderItems);

    // Clear cart
    await this.cartRepo.delete({ userId });

    return this.findOne(saved.id);
  }

  async findMyOrders(userId: string, page = 1, limit = 10) {
    const [items, total] = await this.orderRepo.findAndCount({
      where: { userId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items', 'user', 'payment'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findAll(filters: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    page?: number;
    limit?: number;
    from?: string;
    to?: string;
  }) {
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.user', 'user')
      .leftJoinAndSelect('o.items', 'items')
      .leftJoinAndSelect('o.payment', 'payment')
      .orderBy('o.createdAt', 'DESC');

    if (filters.status) qb.andWhere('o.status = :status', { status: filters.status });
    if (filters.paymentStatus) qb.andWhere('o.paymentStatus = :ps', { ps: filters.paymentStatus });
    if (filters.from) qb.andWhere('o.createdAt >= :from', { from: new Date(filters.from) });
    if (filters.to) qb.andWhere('o.createdAt <= :to', { to: new Date(filters.to) });

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findOne(id);
    order.status = dto.status;
    return this.orderRepo.save(order);
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const count = await this.orderRepo.count();
    return `BKR-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
}
