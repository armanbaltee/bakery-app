import {
  IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsString,
  IsEnum, Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { StockStatus } from '../entities/product.entity';

export class CreateProductDto {
  @ApiProperty()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  slug?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  shortDescription?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  basePrice: number;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isCustomizable?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false, enum: StockStatus })
  @IsOptional()
  @IsEnum(StockStatus)
  stockStatus?: StockStatus;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isBestSeller?: boolean;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
