import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class ProvidersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.provider.findMany({
      where: { tenantId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true, role: true } },
        providerServices: { include: { service: true } },
      },
      orderBy: { sortOrder: 'asc' },
    })
  }

  async findOne(tenantId: string, id: string) {
    const p = await this.prisma.provider.findFirst({
      where: { id, tenantId },
      include: {
        user: true,
        schedules: { orderBy: { dayOfWeek: 'asc' } },
        scheduleBreaks: true,
        providerServices: { include: { service: true } },
        providerLocations: { include: { location: true } },
      },
    })
    if (!p) throw new NotFoundException('נותן השירות לא נמצא')
    return p
  }

  async getSchedule(tenantId: string, providerId: string) {
    const p = await this.prisma.provider.findFirst({ where: { id: providerId, tenantId } })
    if (!p) throw new NotFoundException('נותן השירות לא נמצא')
    return this.prisma.schedule.findMany({
      where: { providerId },
      orderBy: { dayOfWeek: 'asc' },
    })
  }

  async updateSchedule(tenantId: string, providerId: string, schedule: any[]) {
    const p = await this.prisma.provider.findFirst({ where: { id: providerId, tenantId } })
    if (!p) throw new NotFoundException('נותן השירות לא נמצא')
    await this.prisma.schedule.deleteMany({ where: { providerId } })
    await this.prisma.schedule.createMany({
      data: schedule.map(s => ({ ...s, providerId })),
    })
    return this.getSchedule(tenantId, providerId)
  }
}
