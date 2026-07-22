import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

export enum CustomizationType {
  WEIGHT = 'WEIGHT',
  FLAVOR = 'FLAVOR',
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
}

@Entity('customization_options')
export class CustomizationOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, (product) => product.customizationOptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productId: string;

  @Column({ type: 'enum', enum: CustomizationType })
  type: CustomizationType;

  @Column()
  label: string; // display label e.g. "Select Weight", "Cake Message"

  @Column({ type: 'jsonb', nullable: true })
  options: { label: string; value: string; priceModifier?: number }[]; // for WEIGHT/FLAVOR

  @Column({ default: false })
  isRequired: boolean;
}
