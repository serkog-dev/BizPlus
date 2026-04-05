import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { ProvidersService } from './providers.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentTenant } from '../../common/decorators'

@ApiTags('providers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('providers')
export class ProvidersController {
  constructor(private readonly service: ProvidersService) {}

  @Get()
  async findAll(@CurrentTenant() tenantId: string) {
    return { success: true, data: await this.service.findAll(tenantId) }
  }

  @Get(':id')
  async findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return { success: true, data: await this.service.findOne(tenantId, id) }
  }

  @Get(':id/schedule')
  async schedule(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return { success: true, data: await this.service.getSchedule(tenantId, id) }
  }

  @Put(':id/schedule')
  async updateSchedule(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() body: any) {
    return { success: true, data: await this.service.updateSchedule(tenantId, id, body.schedule) }
  }
}
