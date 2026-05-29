import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { CustomersService } from './customers.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentTenant } from '../../common/decorators'
import { CreateCustomerSchema, UpdateCustomerSchema } from '@bizplus/shared'

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Get()
  async findAll(@CurrentTenant() tenantId: string, @Query('search') search?: string,
    @Query('page') page?: string, @Query('limit') limit?: string) {
    const data = await this.service.findAll(tenantId, {
      search, page: page ? +page : 1, limit: limit ? +limit : 50,
    })
    return { success: true, ...data }
  }

  @Get(':id')
  async findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return { success: true, data: await this.service.findOne(tenantId, id) }
  }

  @Post()
  async create(@CurrentTenant() tenantId: string, @Body() body: unknown) {
    const dto = CreateCustomerSchema.parse(body)
    return { success: true, data: await this.service.create(tenantId, dto) }
  }

  @Patch(':id')
  async update(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() body: unknown) {
    const dto = UpdateCustomerSchema.parse(body)
    return { success: true, data: await this.service.update(tenantId, id, dto) }
  }

  @Delete(':id')
  async remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    await this.service.softDelete(tenantId, id)
    return { success: true, message: 'הלקוח הוסר' }
  }
}
