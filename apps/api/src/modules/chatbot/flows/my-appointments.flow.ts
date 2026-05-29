import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../database/prisma.service'
import { ConversationService } from '../conversation/conversation.service'
import { ConversationContext } from '../conversation/conversation-state'
import { formatDateHebrew } from '../conversation/hebrew-nlp'

@Injectable()
export class MyAppointmentsFlow {
  constructor(
    private prisma: PrismaService,
    private convService: ConversationService,
  ) {}

  async handle(ctx: ConversationContext): Promise<string> {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: ctx.tenantSlug } })
    if (!tenant) return '❌ עסק לא נמצא'

    const customer = await this.prisma.customer.findFirst({
      where: { tenantId: tenant.id, phone: ctx.phone },
    })

    if (!customer) {
      await this.convService.clear(ctx.tenantSlug, ctx.phone)
      return '😔 לא נמצאו תורים עבור המספר שלך.'
    }

    const now = new Date()
    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId: tenant.id,
        customerId: customer.id,
        startTime: { gte: now },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      include: {
        service: { select: { name: true, price: true } },
        provider: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { startTime: 'asc' },
      take: 5,
    })

    await this.convService.clear(ctx.tenantSlug, ctx.phone)

    if (appointments.length === 0) {
      return `📅 *התורים שלי*\n\nאין לך תורים קרובים.\n\nשלח *תור* לקביעת תור חדש.`
    }

    const list = appointments.map(a => {
      const day = formatDateHebrew(a.startTime.toISOString().slice(0, 10))
      const time = a.startTime.toTimeString().slice(0, 5)
      const provider = `${a.provider.user.firstName} ${a.provider.user.lastName}`
      return `📋 *${a.service.name}*\n   📅 ${day} ${time}\n   👤 ${provider}\n   💰 ${Number(a.service.price)}₪`
    }).join('\n\n')

    return `📅 *התורים שלי*\n\n${list}\n\nלביטול תור שלח *ביטול*\nלתור חדש שלח *תור*`
  }
}
