import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

export enum VariantType {
  SIZE = 'SIZE',
  FLAVOR = 'FLAVOR',
  WEIGHT = 'WEIGHT',
}

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productId: string;

  @Column({ type: 'enum', enum: VariantType })
  type: VariantType;

  @Column()
  label: string; // e.g. "1 lb", "2 lb", "Chocolate"

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceModifier: number; // added to basePrice

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ default: 0 })
  sortOrder: number;
}
