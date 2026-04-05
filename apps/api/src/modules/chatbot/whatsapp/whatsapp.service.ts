import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'
import { normalizePhoneForWhatsapp } from '../../../common/utils/phone.util'

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name)
  private readonly apiUrl: string
  private readonly token: string

  constructor(private config: ConfigService) {
    const phoneId = this.config.get('WHATSAPP_PHONE_NUMBER_ID') ?? ''
    this.apiUrl = `https://graph.facebook.com/v19.0/${phoneId}/messages`
    this.token = this.config.get('WHATSAPP_ACCESS_TOKEN') ?? ''
  }

  async sendText(to: string, text: string): Promise<void> {
    to = normalizePhoneForWhatsapp(to)

    if (!this.token || !this.config.get('WHATSAPP_PHONE_NUMBER_ID')) {
      // dev mode — just log
      this.logger.log(`[WhatsApp → ${to}]: ${text}`)
      return
    }

    try {
      await axios.post(
        this.apiUrl,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: text, preview_url: false },
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        },
      )
    } catch (err: any) {
      this.logger.error(`Failed to send WhatsApp message to ${to}`, err?.response?.data ?? err.message)
    }
  }

  // מאמת את ה-webhook verification מ-Meta
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    const verifyToken = this.config.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN') ?? 'bizplus_webhook_secret'
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge
    }
    return null
  }

  // מחלץ הודעות נכנסות מפייסבוד webhook payload
  extractMessages(body: any): Array<{ phone: string; text: string; tenantSlug?: string }> {
    const messages: Array<{ phone: string; text: string }> = []
    try {
      const entries = body?.entry ?? []
      for (const entry of entries) {
        for (const change of entry.changes ?? []) {
          const value = change.value
          for (const msg of value?.messages ?? []) {
            if (msg.type === 'text') {
              messages.push({ phone: msg.from, text: msg.text?.body ?? '' })
            }
          }
        }
      }
    } catch (e) {
      this.logger.error('Failed to extract messages from webhook payload', e)
    }
    return messages
  }
}
