import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getToday(tenantId: string) {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0)
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)

    const [appointments, newCustomers, totalCustomers] = await Promise.all([
      this.prisma.appointment.findMany({
        where: { tenantId, startTime: { gte: startOfDay, lte: endOfDay } },
        include: {
          customer: { select: { firstName: true, lastName: true, phone: true } },
          provider: { include: { user: { select: { firstName: true, lastName: true } } } },
          service: { select: { name: true, duration: true } },
        },
        orderBy: { startTime: 'asc' },
      }),
      this.prisma.customer.count({
        where: { tenantId, createdAt: { gte: startOfDay, lte: endOfDay } },
      }),
      this.prisma.customer.count({ where: { tenantId, isActive: true } }),
    ])

    const stats = {
      total: appointments.length,
      completed: appointments.filter(a => a.status === 'COMPLETED').length,
      confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
      pending: appointments.filter(a => a.status === 'PENDING').length,
      cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
      noShow: appointments.filter(a => a.status === 'NO_SHOW').length,
      revenue: appointments
        .filter(a => a.status === 'COMPLETED')
        .reduce((sum, a) => sum + Number(a.price), 0),
      newCustomers,
      totalCustomers,
    }

    return { date: today.toISOString().split('T')[0], stats, appointments }
  }

  async getStats(tenantId: string, from: string, to: string) {
    const fromDate = new Date(from)
    const toDate = new Date(to)

    const [appointments, customers] = await Promise.all([
      this.prisma.appointment.groupBy({
        by: ['status'],
        where: { tenantId, startTime: { gte: fromDate, lte: toDate } },
        _count: true,
      }),
      this.prisma.customer.count({
        where: { tenantId, createdAt: { gte: fromDate, lte: toDate } },
      }),
    ])

    const revenue = await this.prisma.appointment.aggregate({
      where: { tenantId, status: 'COMPLETED', startTime: { gte: fromDate, lte: toDate } },
      _sum: { price: true },
    })

    return {
      period: { from, to },
      appointments: appointments.reduce((acc, g) => ({ ...acc, [g.status]: g._count }), {}),
      totalRevenue: Number(revenue._sum.price || 0),
      newCustomers: customers,
    }
  }
}
