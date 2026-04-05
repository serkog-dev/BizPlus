import { Controller, Get, Param, Query, UseGuards, NotFoundException } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentTenant } from '../../common/decorators'
import { ConversationsService } from './conversations.service'

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private service: ConversationsService) {}

  // GET /conversations?page=1&limit=30
  @Get()
  findAll(
    @CurrentTenant() tenant: { id: string },
    @Query('page') page = '1',
    @Query('limit') limit = '30',
  ) {
    return this.service.findAll(tenant.id, Number(page), Number(limit))
  }

  // GET /conversations/:id/messages?page=1
  @Get(':id/messages')
  async findMessages(
    @CurrentTenant() tenant: { id: string },
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const result = await this.service.findMessages(tenant.id, id, Number(page), Number(limit))
    if (!result) throw new NotFoundException('שיחה לא נמצאה')
    return result
  }
}
