import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { LocationsService } from './locations.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentTenant } from '../../common/decorators'

@ApiTags('locations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('locations')
export class LocationsController {
  constructor(private readonly service: LocationsService) {}

  @Get()
  async findAll(@CurrentTenant() tenantId: string) {
    return { success: true, data: await this.service.findAll(tenantId) }
  }

  @Get(':id')
  async findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return { success: true, data: await this.service.findOne(tenantId, id) }
  }

  @Post()
  async create(@CurrentTenant() tenantId: string, @Body() body: any) {
    return { success: true, data: await this.service.create(tenantId, body) }
  }

  @Patch(':id')
  async update(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() body: any) {
    return { success: true, data: await this.service.update(tenantId, id, body) }
  }
}
