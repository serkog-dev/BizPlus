import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, filters: {
    from?: string
    to?: string
    providerId?: string
    locationId?: string
    status?: string
    customerId?: string
    page?: number
    limit?: number
  }) {
    const { from, to, providerId, locationId, status, customerId, page = 1, limit = 50 } = filters

    const where: any = { tenantId }
    if (from || to) {
      where.startTime = {}
      if (from) where.startTime.gte = new Date(from)
      if (to) where.startTime.lte = new Date(to)
    }
    if (providerId) where.providerId = providerId
    if (locationId) where.locationId = locationId
    if (status) where.status = status
    if (customerId) where.customerId = customerId

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
          provider: { include: { user: { select: { firstName: true, lastName: true } } } },
          service: { select: { id: true, name: true, duration: true } },
          location: { select: { id: true, name: true } },
        },
        orderBy: { startTime: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.appointment.count({ where }),
    ])

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async findOne(tenantId: string, id: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        provider: { include: { user: true } },
        service: true,
        location: true,
      },
    })
    if (!appointment) throw new NotFoundException('התור לא נמצא')
    return appointment
  }

  async update(tenantId: string, id: string, data: any) {
    const existing = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
    })
    if (!existing) throw new NotFoundException('התור לא נמצא')

    return this.prisma.appointment.update({
      where: { id },
      data,
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
        provider: { include: { user: { select: { firstName: true, lastName: true } } } },
        service: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
      },
    })
  }
}
