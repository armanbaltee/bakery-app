import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

export enum PaymentGateway {
  EASYPAISA = 'EASYPAISA',
  JAZZCASH = 'JAZZCASH',
}

export enum PaymentGatewayStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Order, (order) => order.payment)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ unique: true })
  orderId: string;

  @Column({ type: 'enum', enum: PaymentGateway })
  gateway: PaymentGateway;

  @Column({ unique: true })
  txnRefNo: string; // our internal reference

  @Column({ nullable: true })
  gatewayTxnId: string; // gateway's transaction ID

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentGatewayStatus,
    default: PaymentGatewayStatus.PENDING,
  })
  status: PaymentGatewayStatus;

  @Column({ type: 'jsonb', nullable: true })
  gatewayResponse: Record<string, unknown>; // raw response from gateway

  @Column({ nullable: true })
  gatewayMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
