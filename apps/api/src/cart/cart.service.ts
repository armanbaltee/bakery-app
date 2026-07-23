import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private cartRepo: Repository<Cart>,
    @InjectRepository(CartItem) private itemRepo: Repository<CartItem>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
  ) {}

  async getCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepo.findOne({ where: { userId } });
    if (!cart) {
      cart = await this.cartRepo.save(this.cartRepo.create({ userId }));
    }
    return this.cartRepo.findOne({
      where: { id: cart.id },
      relations: ['items', 'items.product', 'items.product.images'],
    });
  }

  async addItem(userId: string, dto: AddCartItemDto): Promise<Cart> {
    const cart = await this.getCart(userId);
    const product = await this.productRepo.findOne({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (!product.isActive) throw new BadRequestException('Product is not available');

    // Calculate price with customizations
    let unitPrice = Number(product.basePrice);
    if (dto.customizations?.weightPriceModifier) {
      unitPrice += Number(dto.customizations.weightPriceModifier);
    }

    // Check for existing item with same product and customizations
    const existingItem = cart.items.find(
      (item) =>
        item.productId === dto.productId &&
        JSON.stringify(item.customizations) === JSON.stringify(dto.customizations),
    );

    if (existingItem) {
      existingItem.quantity += dto.quantity || 1;
      await this.itemRepo.save(existingItem);
    } else {
      const item = this.itemRepo.create({
        cartId: cart.id,
        productId: dto.productId,
        quantity: dto.quantity || 1,
        unitPrice,
        customizations: dto.customizations,
      });
      await this.itemRepo.save(item);
    }

    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto): Promise<Cart> {
    const cart = await this.getCart(userId);
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('Cart item not found');

    if (dto.quantity <= 0) {
      await this.itemRepo.remove(item);
    } else {
      item.quantity = dto.quantity;
      await this.itemRepo.save(item);
    }

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string): Promise<Cart> {
    const cart = await this.getCart(userId);
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('Cart item not found');
    await this.itemRepo.remove(item);
    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<void> {
    await this.cartRepo.delete({ userId });
  }
}
