import { IsOptional, IsString, IsNumberString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StockStatus } from '../entities/product.entity';

export class ProductFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({ enum: StockStatus })
  @IsOptional()
  @IsEnum(StockStatus)
  stockStatus?: StockStatus;

  @ApiPropertyOptional()
  @IsOptional()
  featured?: string;

  @ApiPropertyOptional()
  @IsOptional()
  bestSeller?: string;

  @ApiPropertyOptional()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  limit?: number;
}
