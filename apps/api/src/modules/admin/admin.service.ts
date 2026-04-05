import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getPlatformStats() {
    const [totalTenants, activeTenants, trialTenants, mrr] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { isActive: true, subscription: { status: 'ACTIVE' } } }),
      this.prisma.tenant.count({ where: { subscription: { status: 'TRIAL' } } }),
      this.prisma.subscription.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { monthlyPrice: true },
      }),
    ])

    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    const [appointmentsToday, newTenantsMonth] = await Promise.all([
      this.prisma.appointment.count({ where: { startTime: { gte: startOfDay } } }),
      this.prisma.tenant.count({
        where: { createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) } },
      }),
    ])

    return {
      totalTenants,
      activeTenants,
      trialTenants,
      mrr: Number(mrr._sum.monthlyPrice || 0),
      appointmentsToday,
      newTenantsMonth,
    }
  }

  async getAllTenants(filters: { status?: string; page?: number; limit?: number; search?: string }) {
    const { status, page = 1, limit = 20, search } = filters
    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search } },
      ]
    }
    if (status === 'active') where.isActive = true
    if (status === 'inactive') where.isActive = false

    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        include: {
          subscription: true,
          _count: { select: { customers: true, appointments: true, users: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.tenant.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getTenantDetail(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        subscription: true,
        invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
        _count: { select: { customers: true, appointments: true, users: true, locations: true } },
      },
    })
    if (!tenant) throw new NotFoundException('העסק לא נמצא')
    return tenant
  }

  async updateTenant(id: string, data: { isActive?: boolean; plan?: string; notes?: string }) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } })
    if (!tenant) throw new NotFoundException('העסק לא נמצא')

    return this.prisma.tenant.update({
      where: { id },
      data: {
        isActive: data.isActive,
        ...(data.plan ? { plan: data.plan as any } : {}),
      },
    })
  }

  async getRevenue(period: string) {
    const months = period === 'year' ? 12 : 3
    const from = new Date()
    from.setMonth(from.getMonth() - months)

    const invoices = await this.prisma.invoice.findMany({
      where: { status: 'PAID', paidAt: { gte: from } },
      orderBy: { paidAt: 'asc' },
    })

    // Group by month
    const byMonth: Record<string, number> = {}
    for (const inv of invoices) {
      if (inv.paidAt) {
        const key = inv.paidAt.toISOString().slice(0, 7) // YYYY-MM
        byMonth[key] = (byMonth[key] || 0) + Number(inv.amount)
      }
    }

    return { byMonth, total: invoices.reduce((s, i) => s + Number(i.amount), 0) }
  }
}
