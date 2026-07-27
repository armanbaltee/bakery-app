import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Address } from '../users/entities/address.entity';
import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { ProductImage } from '../products/entities/product-image.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { CustomizationOption } from '../products/entities/customization-option.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Payment } from '../payments/entities/payment.entity';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

config();

const configService = new ConfigService();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: configService.get<string>('DATABASE_URL', 'postgresql://bakery_user:bakery_pass@localhost:5432/bakery_db'),
  entities: [
    User,
    Address,
    Category,
    Product,
    ProductImage,
    ProductVariant,
    CustomizationOption,
    Cart,
    CartItem,
    Order,
    OrderItem,
    Payment,
  ],
  synchronize: false,
  logging: false,
});

async function addImage() {
  await AppDataSource.initialize();
  console.log('🖼️  Adding image to Classic Chocolate Cake...');

  const productRepo = AppDataSource.getRepository(Product);
  const imageRepo = AppDataSource.getRepository(ProductImage);

  const product = await productRepo.findOne({
    where: { slug: 'classic-chocolate-cake' },
    relations: { images: true },
  });

  if (!product) {
    console.error('❌ Classic Chocolate Cake not found! Run the seed first.');
    await AppDataSource.destroy();
    process.exit(1);
  }

  const imageUrl = 'http://localhost:3000/uploads/classic-chocolate-cake.jpg';

  // Check if image already exists
  const exists = product.images?.some((img) => img.url === imageUrl);
  if (exists) {
    console.log('ℹ️  Image already exists for Classic Chocolate Cake. Skipping.');
    await AppDataSource.destroy();
    return;
  }

  // Set all existing images as non-primary first
  if (product.images?.length) {
    await imageRepo.update({ productId: product.id }, { isPrimary: false });
  }

  const image = imageRepo.create({
    productId: product.id,
    url: imageUrl,
    isPrimary: true,
  });

  await imageRepo.save(image);

  console.log(`✅ Image added: ${imageUrl}`);
  console.log(`   Product: ${product.name} (${product.id})`);

  await AppDataSource.destroy();
}

addImage().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
