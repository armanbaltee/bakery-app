import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  AfterLoad,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_images')
export class ProductImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productId: string;

  @Column()
  url: string;

  @Column({ nullable: true })
  altText: string;

  @Column({ default: false })
  isPrimary: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @AfterLoad()
  updateUrl() {
    if (this.url && this.url.startsWith('/uploads/')) {
      const apiHost = process.env.API_URL || 'http://localhost:3000';
      this.url = `${apiHost}${this.url}`;
    }
  }
}
