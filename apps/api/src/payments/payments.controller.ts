import {
  Controller, Post, Get, Body, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/auth.guards';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private service: PaymentsService) {}

  @Post('easypaisa/initiate/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate EasyPaisa hosted checkout' })
  initiateEasypaisa(
    @Param('orderId') orderId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.initiateEasypaisa(orderId, user.id);
  }

  @Post('jazzcash/initiate/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get JazzCash form data for hosted checkout' })
  initiateJazzcash(
    @Param('orderId') orderId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.initiateJazzcash(orderId, user.id);
  }

  // IPN Webhook — public, signature is verified internally
  @Post('easypaisa/callback')
  @ApiOperation({ summary: 'EasyPaisa IPN callback (public webhook)' })
  easypaisaCallback(@Body() data: Record<string, string>) {
    return this.service.handleEasypaisaCallback(data);
  }

  // JazzCash return URL — can be GET or POST
  @Post('jazzcash/callback')
  @ApiOperation({ summary: 'JazzCash return URL callback' })
  jazzcashCallbackPost(@Body() data: Record<string, string>) {
    return this.service.handleJazzcashCallback(data);
  }

  @Get('jazzcash/callback')
  jazzcashCallbackGet(@Query() data: Record<string, string>) {
    return this.service.handleJazzcashCallback(data);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list all payment transactions' })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.findAll(page, limit);
  }
}
