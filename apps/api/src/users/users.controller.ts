import { Controller, Get, Put, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/auth.guards';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User, UserRole } from './entities/user.entity';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private service: UsersService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return this.service.findProfile(user.id);
  }

  @Put('profile')
  updateProfile(@CurrentUser() user: User, @Body() body: Partial<User>) {
    return this.service.updateProfile(user.id, body);
  }

  @Post('addresses')
  addAddress(@CurrentUser() user: User, @Body() body: any) {
    return this.service.addAddress(user.id, body);
  }

  @Put('addresses/:id')
  updateAddress(@CurrentUser() user: User, @Param('id') id: string, @Body() body: any) {
    return this.service.updateAddress(user.id, id, body);
  }

  @Delete('addresses/:id')
  removeAddress(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.removeAddress(user.id, id);
  }

  // Admin routes
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.findAllCustomers(page, limit);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  findOne(@Param('id') id: string) {
    return this.service.findCustomerDetail(id);
  }
}
