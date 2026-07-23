import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { CategoriesModule } from '../categories/categories.module';
import { ProductsModule } from '../products/products.module';
import { CartModule } from '../cart/cart.module';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsModule } from '../payments/payments.module';
import { MailModule } from '../mail/mail.module';
import { UploadsModule } from '../uploads/uploads.module';
import { ReportsModule } from '../reports/reports.module';

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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
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
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        logging: config.get<string>('NODE_ENV') === 'development',
        ssl:
          config.get<string>('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    MailModule,
    UploadsModule,
    ReportsModule,
  ],
})
export class AppModule {}
