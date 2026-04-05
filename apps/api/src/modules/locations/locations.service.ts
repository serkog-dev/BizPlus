import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.location.findMany({ where: { tenantId, isActive: true } })
  }

  async findOne(tenantId: string, id: string) {
    const l = await this.prisma.location.findFirst({ where: { id, tenantId } })
    if (!l) throw new NotFoundException('הסניף לא נמצא')
    return l
  }

  async create(tenantId: string, data: any) {
    return this.prisma.location.create({ data: { tenantId, ...data } })
  }

  async update(tenantId: string, id: string, data: any) {
    await this.findOne(tenantId, id)
    return this.prisma.location.update({ where: { id }, data })
  }
}
