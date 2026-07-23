import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { EasypaisaService } from './gateways/easypaisa.service';
import { JazzcashService } from './gateways/jazzcash.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Order]),
    HttpModule,
    MailModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, EasypaisaService, JazzcashService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
