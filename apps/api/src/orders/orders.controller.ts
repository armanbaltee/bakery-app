import {
  Controller, Post, Get, Put, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/auth.guards';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { OrderStatus } from './entities/order.entity';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private service: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create order from cart (requires auth)' })
  create(@CurrentUser() user: User, @Body() dto: CreateOrderDto) {
    return this.service.create(user.id, dto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user orders' })
  myOrders(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.findMyOrders(user.id, page, limit);
  }

  @Get('my/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findMyOrder(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list all orders' })
  findAll(
    @Query('status') status?: OrderStatus,
    @Query('paymentStatus') paymentStatus?: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.findAll({ status, paymentStatus, page, limit, from, to });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.service.updateStatus(id, dto);
  }
}
