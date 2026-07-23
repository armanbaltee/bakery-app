import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private itemRepo: Repository<OrderItem>,
  ) {}

  async getDashboard() {
    const totalOrders = await this.orderRepo.count();
    const pendingOrders = await this.orderRepo.count({
      where: { status: OrderStatus.PENDING },
    });
    const confirmedOrders = await this.orderRepo.count({
      where: { status: OrderStatus.CONFIRMED },
    });

    const revenueResult = await this.orderRepo
      .createQueryBuilder('o')
      .select('SUM(o.totalAmount)', 'totalRevenue')
      .where('o.paymentStatus = :status', { status: PaymentStatus.PAID })
      .getRawOne();

    const topProducts = await this.itemRepo
      .createQueryBuilder('oi')
      .select('oi.productId', 'productId')
      .addSelect('oi.productName', 'productName')
      .addSelect('SUM(oi.quantity)', 'totalSold')
      .addSelect('SUM(oi.totalPrice)', 'totalRevenue')
      .groupBy('oi.productId')
      .addGroupBy('oi.productName')
      .orderBy('SUM(oi.quantity)', 'DESC')
      .limit(5)
      .getRawMany();

    const recentOrders = await this.orderRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 5,
      select: ['id', 'orderNumber', 'totalAmount', 'status', 'paymentStatus', 'createdAt'],
    });

    return {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      totalRevenue: Number(revenueResult?.totalRevenue || 0),
      topProducts,
      recentOrders,
    };
  }

  async getSalesReport(period: 'daily' | 'weekly' | 'monthly' = 'daily') {
    const trunc =
      period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month';

    const result = await this.orderRepo
      .createQueryBuilder('o')
      .select(`DATE_TRUNC('${trunc}', o.createdAt)`, 'period')
      .addSelect('COUNT(o.id)', 'orderCount')
      .addSelect('SUM(o.totalAmount)', 'revenue')
      .where('o.paymentStatus = :status', { status: PaymentStatus.PAID })
      .groupBy(`DATE_TRUNC('${trunc}', o.createdAt)`)
      .orderBy(`DATE_TRUNC('${trunc}', o.createdAt)`, 'DESC')
      .limit(30)
      .getRawMany();

    return result.map((r) => ({
      period: r.period,
      orderCount: Number(r.orderCount),
      revenue: Number(r.revenue),
    }));
  }
}
