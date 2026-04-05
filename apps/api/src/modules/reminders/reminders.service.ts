import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from '../../database/prisma.service'
import { WhatsappService } from '../chatbot/whatsapp/whatsapp.service'
import { normalizePhoneForWhatsapp } from '../../common/utils/phone.util'

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name)

  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsappService,
  ) {}

  // רץ כל 15 דקות — בודק תורים שצריך לשלוח להם תזכורת
  @Cron('*/15 * * * *')
  async sendReminders() {
    await Promise.all([
      this.send24hReminders(),
      this.send1hReminders(),
    ])
  }

  private async send24hReminders() {
    const now = new Date()
    const from = new Date(now.getTime() + 23 * 60 * 60 * 1000)
    const to   = new Date(now.getTime() + 25 * 60 * 60 * 1000)

    const appointments = await this.prisma.appointment.findMany({
      where: {
        startTime: { gte: from, lte: to },
        status: { in: ['PENDING', 'CONFIRMED'] },
        reminder24hSentAt: null,
      },
      include: {
        customer: { select: { firstName: true, phone: true } },
        service:  { select: { name: true } },
        provider: { include: { user: { select: { firstName: true } } } },
        tenant:   { select: { name: true } },
      },
      take: 100,
    })

    for (const appt of appointments) {
      if (!appt.customer.phone) continue
      try {
        const msg = this.buildReminderMessage(appt, '24h')
        await this.whatsapp.sendText(normalizePhoneForWhatsapp(appt.customer.phone), msg)
        await this.prisma.appointment.update({
          where: { id: appt.id },
          data: { reminder24hSentAt: new Date() },
        })
        this.logger.log(`24h reminder sent → ${appt.customer.phone} (${appt.id})`)
      } catch (err) {
        this.logger.error(`Failed 24h reminder for ${appt.id}`, err)
      }
    }
  }

  private async send1hReminders() {
    const now = new Date()
    const from = new Date(now.getTime() + 45 * 60 * 1000)
    const to   = new Date(now.getTime() + 75 * 60 * 1000)

    const appointments = await this.prisma.appointment.findMany({
      where: {
        startTime: { gte: from, lte: to },
        status: { in: ['PENDING', 'CONFIRMED'] },
        reminder1hSentAt: null,
      },
      include: {
        customer: { select: { firstName: true, phone: true } },
        service:  { select: { name: true } },
        provider: { include: { user: { select: { firstName: true } } } },
        tenant:   { select: { name: true } },
      },
      take: 100,
    })

    for (const appt of appointments) {
      if (!appt.customer.phone) continue
      try {
        const msg = this.buildReminderMessage(appt, '1h')
        await this.whatsapp.sendText(normalizePhoneForWhatsapp(appt.customer.phone), msg)
        await this.prisma.appointment.update({
          where: { id: appt.id },
          data: { reminder1hSentAt: new Date() },
        })
        this.logger.log(`1h reminder sent → ${appt.customer.phone} (${appt.id})`)
      } catch (err) {
        this.logger.error(`Failed 1h reminder for ${appt.id}`, err)
      }
    }
  }

  private buildReminderMessage(
    appt: {
      customer: { firstName: string; phone: string | null }
      service: { name: string }
      provider: { user: { firstName: string } }
      tenant: { name: string }
      startTime: Date
    },
    type: '24h' | '1h',
  ): string {
    const name = appt.customer.firstName
    const service = appt.service.name
    const provider = appt.provider.user.firstName
    const business = appt.tenant.name
    const dayStr = appt.startTime.toLocaleDateString('he-IL', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
    const time = appt.startTime.toTimeString().slice(0, 5)

    if (type === '24h') {
      return (
        `📅 *תזכורת תור — ${business}*\n\n` +
        `שלום ${name}!\n\n` +
        `מחר יש לך תור:\n` +
        `✂️ ${service}\n` +
        `👤 ${provider}\n` +
        `🕐 ${dayStr} בשעה ${time}\n\n` +
        `לביטול שלח *ביטול*`
      )
    } else {
      return (
        `⏰ *תזכורת — בעוד שעה!*\n\n` +
        `${name}, התור שלך ב${business} בעוד שעה:\n\n` +
        `✂️ ${service} עם ${provider}\n` +
        `🕐 ${time}\n\n` +
        `מחכים לך! 💈`
      )
    }
  }
}
