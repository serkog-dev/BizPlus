import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../database/prisma.service'
import { ConversationService } from '../conversation/conversation.service'
import { ConversationContext, ConversationStep } from '../conversation/conversation-state'
import { extractNumber, parseHebrewDate, formatDateHebrew } from '../conversation/hebrew-nlp'
import { AvailabilityService } from '../../appointments/availability.service'
import { BookingService } from '../../appointments/booking.service'

@Injectable()
export class BookingFlow {
  private readonly logger = new Logger(BookingFlow.name)

  constructor(
    private prisma: PrismaService,
    private convService: ConversationService,
    private availabilityService: AvailabilityService,
    private bookingService: BookingService,
  ) {}

  // מתחיל תהליך קביעת תור
  async start(ctx: ConversationContext): Promise<string> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: ctx.tenantSlug },
    })
    if (!tenant) return '❌ עסק לא נמצא'

    const services = await this.prisma.service.findMany({
      where: { tenantId: tenant.id, isActive: true, isPublic: true },
      orderBy: { name: 'asc' },
    })

    if (services.length === 0) {
      return '😔 אין שירותים זמינים כרגע. נסה שוב מאוחר יותר.'
    }

    ctx.step = ConversationStep.AWAITING_SERVICE
    ctx.shownServices = services.map(s => ({
      id: s.id,
      name: s.name,
      duration: s.duration,
      price: Number(s.price),
    }))
    await this.convService.set(ctx)

    const list = services
      .map((s, i) => `${i + 1}. ${s.name} — ${s.duration} דק' — ${Number(s.price)}₪`)
      .join('\n')

    return `💈 *בחירת שירות*\n\nאיזה שירות תרצה?\n\n${list}\n\nשלח את *מספר* השירות שתרצה`
  }

  // טיפול בכל הודעה בהתאם לשלב הנוכחי
  async handle(ctx: ConversationContext, text: string): Promise<string> {
    switch (ctx.step) {
      case ConversationStep.AWAITING_SERVICE:
        return this.handleServiceSelection(ctx, text)
      case ConversationStep.AWAITING_PROVIDER:
        return this.handleProviderSelection(ctx, text)
      case ConversationStep.AWAITING_DATE:
        return this.handleDateSelection(ctx, text)
      case ConversationStep.AWAITING_TIME:
        return this.handleTimeSelection(ctx, text)
      case ConversationStep.AWAITING_CONFIRM:
        return this.handleConfirmation(ctx, text)
      default:
        return this.start(ctx)
    }
  }

  private async handleServiceSelection(ctx: ConversationContext, text: string): Promise<string> {
    const num = extractNumber(text)
    const services = ctx.shownServices ?? []

    if (!num || num < 1 || num > services.length) {
      return `❓ לא הבנתי. שלח את *מספר* השירות (1-${services.length})`
    }

    const selected = services[num - 1]
    ctx.selectedServiceId = selected.id
    ctx.selectedServiceName = selected.name

    const tenant = await this.prisma.tenant.findUnique({ where: { slug: ctx.tenantSlug } })
    const providers = await this.prisma.provider.findMany({
      where: { tenantId: tenant!.id },
      include: { user: { select: { firstName: true, lastName: true, isActive: true } } },
    })
    // סנן רק פעילים (isActive על User)
    const activeProviders = providers.filter(p => p.user.isActive)

    if (activeProviders.length === 1) {
      ctx.selectedProviderId = activeProviders[0].id
      ctx.selectedProviderName = `${activeProviders[0].user.firstName} ${activeProviders[0].user.lastName}`
      ctx.step = ConversationStep.AWAITING_DATE
      ctx.shownProviders = []
      await this.convService.set(ctx)
      return this.askForDate(ctx)
    }

    ctx.step = ConversationStep.AWAITING_PROVIDER
    ctx.shownProviders = activeProviders.map(p => ({
      id: p.id,
      name: `${p.user.firstName} ${p.user.lastName}`,
    }))
    await this.convService.set(ctx)

    const list = activeProviders
      .map((p, i) => `${i + 1}. ${p.user.firstName} ${p.user.lastName}`)
      .join('\n')

    return `✅ בחרת: *${selected.name}*\n\n👤 *בחירת מטפל*\n\n${list}\n\n0. לא משנה לי (הזמן אוטומטית)\n\nשלח את *מספר* המטפל שתרצה`
  }

  private async handleProviderSelection(ctx: ConversationContext, text: string): Promise<string> {
    const num = extractNumber(text)
    const providers = ctx.shownProviders ?? []

    if (num === 0 || text.includes('לא משנה') || text.includes('אוטומטי')) {
      ctx.selectedProviderId = undefined
      ctx.selectedProviderName = 'כלשהו'
    } else if (!num || num < 1 || num > providers.length) {
      return `❓ שלח *מספר* המטפל (1-${providers.length}) או 0 לכל מטפל`
    } else {
      const p = providers[num - 1]
      ctx.selectedProviderId = p.id
      ctx.selectedProviderName = p.name
    }

    ctx.step = ConversationStep.AWAITING_DATE
    await this.convService.set(ctx)
    return this.askForDate(ctx)
  }

  private askForDate(ctx: ConversationContext): string {
    const providerText = ctx.selectedProviderId
      ? `עם *${ctx.selectedProviderName}*`
      : ''
    return (
      `📅 *בחירת תאריך*\n\nשירות: *${ctx.selectedServiceName}* ${providerText}\n\n` +
      `לאיזה יום תרצה?\n\n` +
      `אפשר לכתוב:\n• *היום*\n• *מחר*\n• *שלישי* (יום בשבוע)\n• *15/4* (תאריך)`
    )
  }

  private async handleDateSelection(ctx: ConversationContext, text: string): Promise<string> {
    const date = parseHebrewDate(text)
    if (!date) {
      return `❓ לא הצלחתי להבין את התאריך.\n\nנסה לכתוב: *היום*, *מחר*, *שלישי*, או *15/4*`
    }

    const dateObj = new Date(date)
    if (dateObj < new Date(new Date().setHours(0, 0, 0, 0))) {
      return `❓ לא אפשר לקבוע תור בעבר. אנא בחר תאריך עתידי.`
    }

    ctx.selectedDate = date
    ctx.step = ConversationStep.AWAITING_TIME

    try {
      const tenant = await this.prisma.tenant.findUnique({ where: { slug: ctx.tenantSlug } })

      // מצא סניף ברירת מחדל
      const location = await this.prisma.location.findFirst({
        where: { tenantId: tenant!.id, isDefault: true, isActive: true },
      }) ?? await this.prisma.location.findFirst({
        where: { tenantId: tenant!.id, isActive: true },
      })

      if (!location) {
        ctx.step = ConversationStep.AWAITING_DATE
        await this.convService.set(ctx)
        return `❌ לא נמצא סניף פעיל. פנה לעסק ישירות.`
      }

      ctx.selectedLocationId = location.id

      const slots = await this.availabilityService.getAvailableSlots({
        tenantId: tenant!.id,
        serviceId: ctx.selectedServiceId!,
        locationId: location.id,
        providerId: ctx.selectedProviderId,
        date,
      })

      if (slots.length === 0) {
        ctx.step = ConversationStep.AWAITING_DATE
        await this.convService.set(ctx)
        const dayName = formatDateHebrew(date)
        return `😔 אין זמנים פנויים ב${dayName}.\n\nנסה יום אחר:`
      }

      // שמור slots עם providerName לאפשרות auto-assign
      const topSlots = slots.slice(0, 10)
      ctx.shownSlots = topSlots.map(s => s.startTime.slice(11, 16)) // HH:mm מה-ISO
      // שמור provider IDs במקביל לslots (לשימוש בעת אישור)
      ctx.shownSlotProviders = topSlots.map(s => s.providerId)
      await this.convService.set(ctx)

      const dayName = formatDateHebrew(date)
      const list = ctx.shownSlots.map((t, i) => `${i + 1}. ${t}`).join('\n')
      return `✅ *${dayName}*\n\n⏰ *זמנים פנויים:*\n\n${list}\n\nשלח את *מספר* השעה שתרצה`
    } catch (e) {
      this.logger.error(e)
      return `❌ שגיאה בטעינת זמנים. נסה שוב.`
    }
  }

  private async handleTimeSelection(ctx: ConversationContext, text: string): Promise<string> {
    const num = extractNumber(text)
    const slots = ctx.shownSlots ?? []

    if (!num || num < 1 || num > slots.length) {
      return `❓ שלח *מספר* השעה (1-${slots.length})`
    }

    ctx.selectedTime = slots[num - 1]
    // אם auto-assign — קבע provider לפי הslot שנבחר
    if (!ctx.selectedProviderId && ctx.shownSlotProviders?.[num - 1]) {
      ctx.selectedProviderId = ctx.shownSlotProviders[num - 1]
      // מצא שם
      const provider = await this.prisma.provider.findUnique({
        where: { id: ctx.selectedProviderId },
        include: { user: { select: { firstName: true, lastName: true } } },
      })
      if (provider) {
        ctx.selectedProviderName = `${provider.user.firstName} ${provider.user.lastName}`
      }
    }

    ctx.step = ConversationStep.AWAITING_CONFIRM
    await this.convService.set(ctx)

    const dayName = formatDateHebrew(ctx.selectedDate!)
    return (
      `📋 *אישור תור*\n\n` +
      `✂️ שירות: *${ctx.selectedServiceName}*\n` +
      `👤 מטפל: *${ctx.selectedProviderName}*\n` +
      `📅 תאריך: *${dayName}*\n` +
      `⏰ שעה: *${ctx.selectedTime}*\n\n` +
      `לאשר את התור?\n*כן* — לאשר\n*לא* — לבטל`
    )
  }

  private async handleConfirmation(ctx: ConversationContext, text: string): Promise<string> {
    const lower = text.toLowerCase()
    const isYes = ['כן', 'אשר', 'ok', 'yes', 'בסדר', '👍', '✅'].some(w => lower.includes(w))
    const isNo = ['לא', 'no', 'cancel', 'בטל', '❌'].some(w => lower.includes(w))

    if (isNo) {
      await this.convService.clear(ctx.tenantSlug, ctx.phone)
      return `❌ התור בוטל.\n\nשלח *תור* כדי לקבוע מחדש.`
    }

    if (!isYes) {
      return `שלח *כן* לאישור התור או *לא* לביטול`
    }

    try {
      const tenant = await this.prisma.tenant.findUnique({ where: { slug: ctx.tenantSlug } })

      // מצא או צור לקוח
      let customer = await this.prisma.customer.findFirst({
        where: { tenantId: tenant!.id, phone: ctx.phone },
      })
      if (!customer) {
        customer = await this.prisma.customer.create({
          data: {
            tenantId: tenant!.id,
            firstName: ctx.phone,
            lastName: '',
            phone: ctx.phone,
            source: 'WHATSAPP',
          },
        })
      }

      const startTime = new Date(`${ctx.selectedDate}T${ctx.selectedTime}:00`)

      await this.bookingService.createAppointment(tenant!.id, {
        customerId: customer.id,
        serviceId: ctx.selectedServiceId!,
        providerId: ctx.selectedProviderId!,
        locationId: ctx.selectedLocationId!,
        startTime: startTime.toISOString(),
        notes: 'נקבע דרך וואטסאפ',
      }, 'WHATSAPP')

      await this.convService.clear(ctx.tenantSlug, ctx.phone)

      const dayName = formatDateHebrew(ctx.selectedDate!)
      return (
        `✅ *התור נקבע בהצלחה!*\n\n` +
        `✂️ ${ctx.selectedServiceName}\n` +
        `📅 ${dayName}\n` +
        `⏰ ${ctx.selectedTime}\n\n` +
        `לביטול או שינוי שלח *ביטול*\n` +
        `לתורים שלך שלח *התורים שלי*`
      )
    } catch (err: any) {
      this.logger.error(err)
      if (err.message?.includes('conflict') || err.status === 409) {
        ctx.step = ConversationStep.AWAITING_TIME
        await this.convService.set(ctx)
        return `😔 הזמן הזה כבר נתפס. בחר שעה אחרת:`
      }
      return `❌ אירעה שגיאה בקביעת התור. נסה שוב.`
    }
  }
}
