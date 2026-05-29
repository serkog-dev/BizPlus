import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { ConversationService } from './conversation/conversation.service'
import { ConversationStep } from './conversation/conversation-state'
import { detectIntent, Intent } from './conversation/hebrew-nlp'
import { BookingFlow } from './flows/booking.flow'
import { CancelFlow } from './flows/cancel.flow'
import { MyAppointmentsFlow } from './flows/my-appointments.flow'

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name)

  constructor(
    private prisma: PrismaService,
    private convService: ConversationService,
    private bookingFlow: BookingFlow,
    private cancelFlow: CancelFlow,
    private myAppointmentsFlow: MyAppointmentsFlow,
  ) {}

  async processMessage(tenantSlug: string, phone: string, text: string): Promise<string> {
    this.logger.log(`[${tenantSlug}] ${phone}: ${text}`)

    const ctx = await this.convService.getOrCreate(tenantSlug, phone)

    // --- שלב שאלת שם (לקוח חדש) ---
    if (ctx.step === ConversationStep.AWAITING_NAME) {
      const name = text.trim()
      if (name.length < 2 || name.length > 50) {
        return `שלח את שמך בבקשה (לפחות 2 אותיות)`
      }

      // שמור שם בcontext ובDB
      ctx.customerName = name
      const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } })
      if (tenant) {
        const parts = name.split(' ')
        const firstName = parts[0]
        const lastName = parts.slice(1).join(' ') || ''

        // צור לקוח חדש עם השם
        await this.prisma.customer.upsert({
          where: { tenantId_phone: { tenantId: tenant.id, phone } },
          create: { tenantId: tenant.id, phone, firstName, lastName, source: 'WHATSAPP' },
          update: { firstName, lastName },
        })
      }

      // המשך לכוונה המקורית שהלקוח ביקש
      const pendingIntent = ctx.pendingIntent
      ctx.step = ConversationStep.IDLE
      ctx.pendingIntent = undefined
      await this.convService.set(ctx)

      const greeting = `שלום ${name}! 👋\n\n`

      if (pendingIntent === 'BOOK') return greeting + await this.bookingFlow.start(ctx)
      if (pendingIntent === 'CANCEL') return greeting + await this.cancelFlow.start(ctx)
      if (pendingIntent === 'MY_APPOINTMENTS') return greeting + await this.myAppointmentsFlow.handle(ctx)
      return greeting + this.getWelcome()
    }

    // --- אם המשתמש נמצא באמצע תהליך — המשך אותו ---
    if (ctx.step !== ConversationStep.IDLE) {
      if (['התחל', 'תפריט', 'menu', 'reset', '/start'].includes(text.trim().toLowerCase())) {
        await this.convService.clear(tenantSlug, phone)
        return this.getWelcome()
      }
      if (ctx.step === ConversationStep.AWAITING_CANCEL_CONFIRM) {
        return this.cancelFlow.handle(ctx, text)
      }
      return this.bookingFlow.handle(ctx, text)
    }

    // --- בדוק אם לקוח חדש שאין לו שם ---
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } })
    if (tenant) {
      const customer = await this.prisma.customer.findUnique({
        where: { tenantId_phone: { tenantId: tenant.id, phone } },
      })
      const isNew = !customer || customer.firstName === phone // שם=טלפון = נוצר ידנית בלי שם
      if (isNew) {
        const intent = detectIntent(text)
        ctx.step = ConversationStep.AWAITING_NAME
        ctx.pendingIntent = intent !== Intent.UNKNOWN && intent !== Intent.HELP ? intent : undefined
        await this.convService.set(ctx)
        const tenantData = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } })
        const businessName = tenantData?.name ?? 'העסק'
        return `👋 *שלום! ברוכים הבאים ל${businessName}*\n\nאנחנו שמחים לעזור! מה שמך?`
      }
    }

    // --- זיהוי כוונה ---
    const intent = detectIntent(text)

    switch (intent) {
      case Intent.BOOK:
        return this.bookingFlow.start(ctx)
      case Intent.CANCEL:
        return this.cancelFlow.start(ctx)
      case Intent.MY_APPOINTMENTS:
        return this.myAppointmentsFlow.handle(ctx)
      case Intent.HELP:
        return this.getWelcomeByName(tenant?.id, phone)
      default:
        return this.getWelcomeByName(tenant?.id, phone)
    }
  }

  private async getWelcomeByName(tenantId: string | undefined, phone: string): Promise<string> {
    if (tenantId) {
      const customer = await this.prisma.customer.findUnique({
        where: { tenantId_phone: { tenantId, phone } },
        select: { firstName: true },
      })
      if (customer?.firstName && customer.firstName !== phone) {
        return this.getWelcome(customer.firstName)
      }
    }
    return this.getWelcome()
  }

  private getWelcome(name?: string): string {
    const greeting = name ? `👋 *שלום ${name}!*` : `👋 *שלום! ברוכים הבאים*`
    return (
      `${greeting}\n\n` +
      `מה תרצה לעשות?\n\n` +
      `📅 *תור* — קביעת תור חדש\n` +
      `🗑️ *ביטול* — ביטול תור קיים\n` +
      `📋 *התורים שלי* — צפייה בתורים שלי\n\n` +
      `פשוט שלח את המילה המתאימה`
    )
  }
}
