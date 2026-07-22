import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards/auth.guards';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
@ApiBearerAuth()
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('dashboard')
  getDashboard() {
    return this.service.getDashboard();
  }

  @Get('sales')
  getSales(@Query('period') period: 'daily' | 'weekly' | 'monthly') {
    return this.service.getSalesReport(period || 'daily');
  }
}
