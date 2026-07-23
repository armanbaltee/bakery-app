import { IsNotEmpty, IsEnum, IsOptional, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../entities/order.entity';

class DeliveryAddressDto {
  @ApiProperty() @IsNotEmpty() street: string;
  @ApiProperty() @IsNotEmpty() city: string;
  @ApiProperty() @IsOptional() province?: string;
  @ApiProperty() @IsOptional() postalCode?: string;
  @ApiProperty() @IsNotEmpty() contactPhone: string;
}

export class CreateOrderDto {
  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ type: DeliveryAddressDto })
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress: DeliveryAddressDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
