import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { AdminService } from './admin.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { SuperAdminGuard } from '../../common/guards/super-admin.guard'

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Get('stats')
  async stats() {
    return { success: true, data: await this.service.getPlatformStats() }
  }

  @Get('tenants')
  async tenants(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.service.getAllTenants({
      status, search, page: page ? +page : 1, limit: limit ? +limit : 20,
    })
    return { success: true, ...data }
  }

  @Get('tenants/:id')
  async tenantDetail(@Param('id') id: string) {
    return { success: true, data: await this.service.getTenantDetail(id) }
  }

  @Patch('tenants/:id')
  async updateTenant(@Param('id') id: string, @Body() body: any) {
    return { success: true, data: await this.service.updateTenant(id, body) }
  }

  @Get('revenue')
  async revenue(@Query('period') period: string = 'quarter') {
    return { success: true, data: await this.service.getRevenue(period) }
  }
}
