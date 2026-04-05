import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { AppointmentsService } from './appointments.service'
import { BookingService } from './booking.service'
import { AvailabilityService } from './availability.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { CurrentUser, CurrentTenant, Roles } from '../../common/decorators'
import { CreateAppointmentSchema, UpdateAppointmentStatusSchema, AvailabilityQuerySchema } from '@bizplus/shared'

@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly bookingService: BookingService,
    private readonly availabilityService: AvailabilityService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'קבל רשימת תורים (לוח שנה)' })
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('providerId') providerId?: string,
    @Query('locationId') locationId?: string,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.appointmentsService.findAll(tenantId, {
      from, to, providerId, locationId, status, customerId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    })
    return { success: true, ...data }
  }

  @Get('availability')
  @ApiOperation({ summary: 'בדוק זמינות לתור' })
  async getAvailability(
    @CurrentTenant() tenantId: string,
    @Query() query: any,
  ) {
    const dto = AvailabilityQuerySchema.parse(query)
    const days = dto.days || 7
    const slots = []

    for (let i = 0; i < days; i++) {
      const date = new Date(dto.date)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      const daySlots = await this.availabilityService.getAvailableSlots({
        tenantId,
        serviceId: dto.serviceId,
        locationId: dto.locationId,
        date: dateStr,
        providerId: dto.providerId,
      })
      slots.push({ date: dateStr, slots: daySlots })
    }

    return { success: true, data: slots }
  }

  @Get(':id')
  @ApiOperation({ summary: 'פרטי תור' })
  async findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    const data = await this.appointmentsService.findOne(tenantId, id)
    return { success: true, data }
  }

  @Post()
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST')
  @ApiOperation({ summary: 'הזמן תור חדש' })
  async create(@CurrentTenant() tenantId: string, @Body() body: unknown) {
    const dto = CreateAppointmentSchema.parse(body)
    const data = await this.bookingService.createAppointment(tenantId, dto, 'DASHBOARD')
    return { success: true, data }
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'עדכן סטטוס תור' })
  async updateStatus(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const dto = UpdateAppointmentStatusSchema.parse(body)
    const data = await this.bookingService.updateStatus(tenantId, id, dto.status, dto.cancelReason)
    return { success: true, data }
  }

  @Patch(':id')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST')
  @ApiOperation({ summary: 'עדכן פרטי תור' })
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const data = await this.appointmentsService.update(tenantId, id, body)
    return { success: true, data }
  }
}
