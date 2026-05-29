import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async getMyTenant(tenantId: string) {
    const t = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { subscription: true, locations: { where: { isActive: true } } },
    })
    if (!t) throw new NotFoundException('העסק לא נמצא')
    return t
  }

  async update(tenantId: string, data: any) {
    return this.prisma.tenant.update({ where: { id: tenantId }, data })
  }
}
