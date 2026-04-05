import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { PrismaService } from '../../database/prisma.service'
import { BookingService } from '../appointments/booking.service'
import { AvailabilityService } from '../appointments/availability.service'
import { Public } from '../../common/decorators'
import { PublicBookingSchema, AvailabilityQuerySchema } from '@bizplus/shared'

@ApiTags('public')
@Public()
@Controller('public')
export class PublicBookingController {
  constructor(
    private prisma: PrismaService,
    private booking: BookingService,
    private availability: AvailabilityService,
  ) {}

  @Get(':slug')
  async getBusinessInfo(@Param('slug') slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug, isActive: true },
      select: {
        id: true, name: true, slug: true, logoUrl: true, brandColors: true, phone: true,
        locations: { where: { isActive: true }, select: { id: true, name: true, address: true } },
      },
    })
    if (!tenant) return { success: false, error: 'העסק לא נמצא' }
    return { success: true, data: tenant }
  }

  @Get(':slug/services')
  async getServices(@Param('slug') slug: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug, isActive: true } })
    if (!tenant) return { success: false, error: 'העסק לא נמצא' }
    const services = await this.prisma.service.findMany({
      where: { tenantId: tenant.id, isActive: true, isPublic: true },
      orderBy: { sortOrder: 'asc' },
    })
    return { success: true, data: services }
  }

  @Get(':slug/providers')
  async getProviders(@Param('slug') slug: string, @Query('serviceId') serviceId?: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug, isActive: true } })
    if (!tenant) return { success: false, error: 'העסק לא נמצא' }
    const where: any = { tenantId: tenant.id }
    if (serviceId) where.providerServices = { some: { serviceId } }
    const providers = await this.prisma.provider.findMany({
      where,
      include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
      orderBy: { sortOrder: 'asc' },
    })
    return { success: true, data: providers }
  }

  @Get(':slug/availability')
  async getAvailability(@Param('slug') slug: string, @Query() query: any) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug, isActive: true } })
    if (!tenant) return { success: false, error: 'העסק לא נמצא' }
    const dto = AvailabilityQuerySchema.parse(query)
    const days = dto.days || 7
    const results = []
    for (let i = 0; i < days; i++) {
      const d = new Date(dto.date)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const slots = await this.availability.getAvailableSlots({
        tenantId: tenant.id, serviceId: dto.serviceId,
        locationId: dto.locationId, date: dateStr, providerId: dto.providerId,
      })
      results.push({ date: dateStr, slots })
    }
    return { success: true, data: results }
  }

  @Post(':slug/book')
  async book(@Param('slug') slug: string, @Body() body: unknown) {
    const dto = PublicBookingSchema.parse(body)
    const data = await this.booking.publicBook(slug, dto)
    return { success: true, data }
  }
}
