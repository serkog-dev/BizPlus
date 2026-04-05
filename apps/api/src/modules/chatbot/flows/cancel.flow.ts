import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../database/prisma.service'
import { ConversationService } from '../conversation/conversation.service'
import { ConversationContext, ConversationStep } from '../conversation/conversation-state'
import { extractNumber, formatDateHebrew } from '../conversation/hebrew-nlp'

@Injectable()
export class CancelFlow {
  private readonly logger = new Logger(CancelFlow.name)

  constructor(
    private prisma: PrismaService,
    private convService: ConversationService,
  ) {}

  // מתחיל תהליך ביטול תור — מציג את התורים הקרובים של הלקוח
  async start(ctx: ConversationContext): Promise<string> {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: ctx.tenantSlug } })
    if (!tenant) return '❌ עסק לא נמצא'

    const customer = await this.prisma.customer.findFirst({
      where: { tenantId: tenant.id, phone: ctx.phone },
    })

    if (!customer) {
      await this.convService.clear(ctx.tenantSlug, ctx.phone)
      return '😔 לא נמצאו תורים קרובים עבור המספר שלך.'
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
        service: { select: { name: true } },
        provider: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { startTime: 'asc' },
      take: 5,
    })

    if (appointments.length === 0) {
      await this.convService.clear(ctx.tenantSlug, ctx.phone)
      return '😔 אין לך תורים קרובים לביטול.'
    }

    ctx.step = ConversationStep.AWAITING_CANCEL_CONFIRM
    ctx.shownAppointments = appointments.map(a => ({
      id: a.id,
      label: `${a.service.name} — ${formatDateHebrew(a.startTime.toISOString().slice(0, 10))} ${a.startTime.toTimeString().slice(0, 5)} עם ${a.provider.user.firstName}`,
    }))
    await this.convService.set(ctx)

    const list = ctx.shownAppointments.map((a, i) => `${i + 1}. ${a.label}`).join('\n')
    return `🗑️ *ביטול תור*\n\nאיזה תור תרצה לבטל?\n\n${list}\n\nשלח את *מספר* התור לביטול\nאו *0* לחזרה`
  }

  // טיפול בבחירת התור לביטול
  async handle(ctx: ConversationContext, text: string): Promise<string> {
    const num = extractNumber(text)
    const appointments = ctx.shownAppointments ?? []

    if (num === 0 || text.includes('חזור') || text.includes('ביטול')) {
      await this.convService.clear(ctx.tenantSlug, ctx.phone)
      return `👋 חזרת לתפריט הראשי.\n\nשלח *תור* לקביעת תור חדש.`
    }

    if (!num || num < 1 || num > appointments.length) {
      return `❓ שלח *מספר* התור לביטול (1-${appointments.length}) או *0* לחזרה`
    }

    const selected = appointments[num - 1]

    try {
      await this.prisma.appointment.update({
        where: { id: selected.id },
        data: { status: 'CANCELLED', cancelReason: 'ביטול דרך וואטסאפ' },
      })

      await this.convService.clear(ctx.tenantSlug, ctx.phone)

      return (
        `✅ *התור בוטל בהצלחה*\n\n` +
        `${selected.label}\n\n` +
        `לקביעת תור חדש שלח *תור*`
      )
    } catch (err) {
      this.logger.error(err)
      return `❌ אירעה שגיאה בביטול התור. נסה שוב.`
    }
  }
}
