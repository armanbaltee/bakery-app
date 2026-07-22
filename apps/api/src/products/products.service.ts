import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Between, FindManyOptions } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { CustomizationOption } from './entities/customization-option.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(ProductImage) private imageRepo: Repository<ProductImage>,
    @InjectRepository(ProductVariant)
    private variantRepo: Repository<ProductVariant>,
    @InjectRepository(CustomizationOption)
    private customizationRepo: Repository<CustomizationOption>,
  ) {}

  async findAll(filter: ProductFilterDto) {
    const where: FindManyOptions<Product>['where'] = { isActive: true };

    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.images', 'images')
      .leftJoinAndSelect('p.category', 'category')
      .where('p.isActive = true');

    if (filter.categoryId) {
      qb.andWhere('p.categoryId = :categoryId', { categoryId: filter.categoryId });
    }
    if (filter.search) {
      qb.andWhere('(p.name ILIKE :search OR p.description ILIKE :search)', {
        search: `%${filter.search}%`,
      });
    }
    if (filter.minPrice !== undefined) {
      qb.andWhere('p.basePrice >= :minPrice', { minPrice: filter.minPrice });
    }
    if (filter.maxPrice !== undefined) {
      qb.andWhere('p.basePrice <= :maxPrice', { maxPrice: filter.maxPrice });
    }
    if (filter.stockStatus) {
      qb.andWhere('p.stockStatus = :stockStatus', { stockStatus: filter.stockStatus });
    }
    if (filter.featured === 'true') {
      qb.andWhere('p.isFeatured = true');
    }
    if (filter.bestSeller === 'true') {
      qb.andWhere('p.isBestSeller = true');
    }

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    qb.skip((page - 1) * limit).take(limit);
    qb.orderBy('p.sortOrder', 'ASC').addOrderBy('p.createdAt', 'DESC');

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findBySlug(slug: string) {
    const product = await this.productRepo.findOne({
      where: { slug, isActive: true },
      relations: ['images', 'category', 'variants', 'customizationOptions'],
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findById(id: string) {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['images', 'category', 'variants', 'customizationOptions'],
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto) {
    const slug =
      dto.slug ||
      dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const product = this.productRepo.create({ ...dto, slug });
    return this.productRepo.save(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.findById(id);
    Object.assign(product, dto);
    return this.productRepo.save(product);
  }

  async remove(id: string) {
    const product = await this.findById(id);
    await this.productRepo.remove(product);
    return { message: 'Product deleted' };
  }

  async addImage(productId: string, url: string, isPrimary = false) {
    const product = await this.findById(productId);
    if (isPrimary) {
      await this.imageRepo.update({ productId }, { isPrimary: false });
    }
    const image = this.imageRepo.create({ productId, url, isPrimary });
    return this.imageRepo.save(image);
  }

  async removeImage(productId: string, imageId: string) {
    const image = await this.imageRepo.findOne({
      where: { id: imageId, productId },
    });
    if (!image) throw new NotFoundException('Image not found');
    await this.imageRepo.remove(image);
    return { message: 'Image removed' };
  }

  async upsertVariants(productId: string, variants: Partial<ProductVariant>[]) {
    await this.variantRepo.delete({ productId });
    const entities = variants.map((v) => this.variantRepo.create({ ...v, productId }));
    return this.variantRepo.save(entities);
  }

  async upsertCustomizations(
    productId: string,
    customizations: Partial<CustomizationOption>[],
  ) {
    await this.customizationRepo.delete({ productId });
    const entities = customizations.map((c) =>
      this.customizationRepo.create({ ...c, productId }),
    );
    return this.customizationRepo.save(entities);
  }

  // Admin: get all products including inactive
  async adminFindAll(page = 1, limit = 20) {
    const [items, total] = await this.productRepo.findAndCount({
      relations: ['images', 'category'],
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
