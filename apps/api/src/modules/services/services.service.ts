import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { CreateServiceDto, UpdateServiceDto } from '@bizplus/shared'

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.service.findMany({
      where: { tenantId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
  }

  async findOne(tenantId: string, id: string) {
    const s = await this.prisma.service.findFirst({ where: { id, tenantId } })
    if (!s) throw new NotFoundException('השירות לא נמצא')
    return s
  }

  async create(tenantId: string, dto: CreateServiceDto) {
    return this.prisma.service.create({ data: { tenantId, ...dto } as any })
  }

  async update(tenantId: string, id: string, dto: UpdateServiceDto) {
    await this.findOne(tenantId, id)
    return this.prisma.service.update({ where: { id }, data: dto as any })
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id)
    return this.prisma.service.update({ where: { id }, data: { isActive: false } })
  }
}
