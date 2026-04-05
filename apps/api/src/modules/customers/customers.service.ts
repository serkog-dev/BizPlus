import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { CreateCustomerDto, UpdateCustomerDto } from '@bizplus/shared'

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, filters: {
    search?: string; tags?: string[]; page?: number; limit?: number
  }) {
    const { search, page = 1, limit = 50 } = filters
    const where: any = { tenantId, isActive: true }
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where, orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit, take: limit,
        include: { preferredProvider: { include: { user: { select: { firstName: true, lastName: true } } } } },
      }),
      this.prisma.customer.count({ where }),
    ])
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findOne(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        appointments: {
          include: { service: true, provider: { include: { user: true } } },
          orderBy: { startTime: 'desc' }, take: 20,
        },
        conversations: { orderBy: { lastMessageAt: 'desc' }, take: 5 },
      },
    })
    if (!customer) throw new NotFoundException('הלקוח לא נמצא')
    return customer
  }

  async create(tenantId: string, dto: CreateCustomerDto) {
    const existing = await this.prisma.customer.findFirst({ where: { tenantId, phone: dto.phone } })
    if (existing) throw new ConflictException('לקוח עם מספר טלפון זה כבר קיים')
    return this.prisma.customer.create({
      data: { tenantId, ...dto, source: 'MANUAL' as any },
    })
  }

  async update(tenantId: string, id: string, dto: UpdateCustomerDto) {
    await this.findOne(tenantId, id)
    return this.prisma.customer.update({ where: { id }, data: dto as any })
  }

  async softDelete(tenantId: string, id: string) {
    await this.findOne(tenantId, id)
    return this.prisma.customer.update({ where: { id }, data: { isActive: false } })
  }
}
