import { IsNotEmpty, IsOptional, IsNumber, Min, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddCartItemDto {
  @ApiProperty()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  customizations?: {
    weight?: string;
    flavor?: string;
    cakeMessage?: string;
    referenceImageUrl?: string;
    weightPriceModifier?: number;
    [key: string]: unknown;
  };
}
