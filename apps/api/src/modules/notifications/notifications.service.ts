import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { WhatsappService } from '../chatbot/whatsapp/whatsapp.service'
import { normalizePhoneForWhatsapp } from '../../common/utils/phone.util'

// סוגי ה-source שמגיעים מהבוט — אנחנו לא שולחים WhatsApp נוסף כי הבוט כבר שלח
const CHATBOT_SOURCES = ['WHATSAPP', 'SMS', 'TELEGRAM']

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)

  constructor(private whatsapp: WhatsappService) {}

  // כשנוצר תור (מהדשבורד) — שלח אישור ללקוח
  @OnEvent('appointment.created')
  async onAppointmentCreated(payload: { appointment: any; source: string }) {
    const { appointment, source } = payload

    // אם הבוט יצר את התור — הוא כבר שלח אישור בשיחה
    if (CHATBOT_SOURCES.includes(source)) return

    const phone = appointment.customer?.phone
    if (!phone) return

    try {
      const msg = this.buildConfirmationMessage(appointment)
      await this.whatsapp.sendText(normalizePhoneForWhatsapp(phone), msg)
      this.logger.log(`Confirmation sent → ${phone} (appointment ${appointment.id})`)
    } catch (err) {
      this.logger.error(`Failed to send confirmation to ${phone}`, err)
    }
  }

  // כשתור מבוטל (מהדשבורד) — שלח הודעת ביטול ללקוח
  @OnEvent('appointment.cancelled')
  async onAppointmentCancelled(payload: { appointment: any }) {
    const { appointment } = payload

    const phone = appointment.customer?.phone
    if (!phone) return

    // אל תשלח אם הלקוח עצמו ביטל דרך הבוט
    if (appointment.cancelledBy === 'customer') return

    try {
      const msg = this.buildCancellationMessage(appointment)
      await this.whatsapp.sendText(normalizePhoneForWhatsapp(phone), msg)
      this.logger.log(`Cancellation notice sent → ${phone} (appointment ${appointment.id})`)
    } catch (err) {
      this.logger.error(`Failed to send cancellation notice to ${phone}`, err)
    }
  }

  private buildConfirmationMessage(appt: any): string {
    const name = appt.customer?.firstName ?? ''
    const service = appt.service?.name ?? ''
    const provider = appt.provider?.user?.firstName ?? ''
    const business = appt.tenant?.name ?? ''
    const date = new Date(appt.startTime)
    const dayStr = date.toLocaleDateString('he-IL', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
    const time = date.toTimeString().slice(0, 5)

    return (
      `✅ *התור שלך אושר!*\n\n` +
      `שלום ${name}!\n\n` +
      `📋 ${service}\n` +
      `👤 ${provider} | ${business}\n` +
      `📅 ${dayStr}\n` +
      `🕐 ${time}\n\n` +
      `לביטול שלח *ביטול*`
    )
  }

  private buildCancellationMessage(appt: any): string {
    const name = appt.customer?.firstName ?? ''
    const service = appt.service?.name ?? ''
    const business = appt.tenant?.name ?? ''
    const date = new Date(appt.startTime)
    const dayStr = date.toLocaleDateString('he-IL', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
    const time = date.toTimeString().slice(0, 5)
    const reason = appt.cancelReason ? `\nסיבה: ${appt.cancelReason}` : ''

    return (
      `❌ *התור בוטל*\n\n` +
      `שלום ${name},\n\n` +
      `התור הבא בוטל:${reason}\n\n` +
      `✂️ ${service} | ${business}\n` +
      `📅 ${dayStr} ${time}\n\n` +
      `לקביעת תור חדש שלח *תור*`
    )
  }
}
