import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { TenantsService } from './tenants.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentTenant } from '../../common/decorators'

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly service: TenantsService) {}

  @Get('me')
  async me(@CurrentTenant() tenantId: string) {
    return { success: true, data: await this.service.getMyTenant(tenantId) }
  }

  @Patch('me')
  async update(@CurrentTenant() tenantId: string, @Body() body: any) {
    return { success: true, data: await this.service.update(tenantId, body) }
  }
}
