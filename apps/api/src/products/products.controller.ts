import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, UseInterceptors, UploadedFile, ParseFilePipe,
  MaxFileSizeValidator, FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/auth.guards';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { UploadsService } from '../uploads/uploads.service';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private service: ProductsService,
    private uploadsService: UploadsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List products with filters (public)' })
  findAll(@Query() filter: ProductFilterDto) {
    return this.service.findAll(filter);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  adminFindAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.adminFindAll(page, limit);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get product by slug (public)' })
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /image\/(jpeg|png|webp)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Query('primary') primary?: string,
  ) {
    const url = await this.uploadsService.saveFile(file);
    return this.service.addImage(id, url, primary === 'true');
  }

  @Delete(':id/images/:imageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  removeImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    return this.service.removeImage(id, imageId);
  }
}
