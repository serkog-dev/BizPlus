import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { ServicesService } from './services.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentTenant } from '../../common/decorators'
import { CreateServiceSchema, UpdateServiceSchema } from '@bizplus/shared'

@ApiTags('services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly service: ServicesService) {}

  @Get()
  async findAll(@CurrentTenant() tenantId: string) {
    return { success: true, data: await this.service.findAll(tenantId) }
  }

  @Get(':id')
  async findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return { success: true, data: await this.service.findOne(tenantId, id) }
  }

  @Post()
  async create(@CurrentTenant() tenantId: string, @Body() body: unknown) {
    return { success: true, data: await this.service.create(tenantId, CreateServiceSchema.parse(body)) }
  }

  @Patch(':id')
  async update(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() body: unknown) {
    return { success: true, data: await this.service.update(tenantId, id, UpdateServiceSchema.parse(body)) }
  }

  @Delete(':id')
  async remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    await this.service.remove(tenantId, id)
    return { success: true, message: 'השירות הוסר' }
  }
}
