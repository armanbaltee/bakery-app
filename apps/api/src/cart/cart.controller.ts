import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guards';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private service: CartService) {}

  @Get()
  getCart(@CurrentUser() user: User) {
    return this.service.getCart(user.id);
  }

  @Post('items')
  addItem(@CurrentUser() user: User, @Body() dto: AddCartItemDto) {
    return this.service.addItem(user.id, dto);
  }

  @Put('items/:id')
  updateItem(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.service.updateItem(user.id, id, dto);
  }

  @Delete('items/:id')
  removeItem(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.removeItem(user.id, id);
  }
}
