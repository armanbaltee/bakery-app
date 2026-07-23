import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cartId' })
  cart!: Cart;

  @Column()
  cartId!: string;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column()
  productId!: string;

  @Column({ default: 1 })
  quantity!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice!: number;

  // Stores selected customizations: weight, flavor, message, referenceImageUrl
  @Column({ type: 'jsonb', nullable: true })
  customizations!: Record<string, unknown>;
}
