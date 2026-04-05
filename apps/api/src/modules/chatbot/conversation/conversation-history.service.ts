import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../database/prisma.service'

@Injectable()
export class ConversationHistoryService {
  private readonly logger = new Logger(ConversationHistoryService.name)

  constructor(private prisma: PrismaService) {}

  /**
   * שומר הודעה (נכנסת או יוצאת) ב-DB
   * יוצר/מעדכן את ה-Conversation בהתאם
   */
  async saveMessage(params: {
    tenantSlug: string
    phone: string
    direction: 'INBOUND' | 'OUTBOUND'
    content: string
    channel?: string
  }): Promise<void> {
    const { tenantSlug, phone, direction, content, channel = 'WHATSAPP' } = params

    try {
      const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } })
      if (!tenant) return

      const customer = await this.prisma.customer.findUnique({
        where: { tenantId_phone: { tenantId: tenant.id, phone } },
      })
      if (!customer) return // אל תשמור הודעות של לקוחות לא ידועים

      // מצא או צור שיחה קיימת
      let conversation = await this.prisma.conversation.findFirst({
        where: { tenantId: tenant.id, customerId: customer.id, channel: channel as any },
        orderBy: { createdAt: 'desc' },
      })

      if (!conversation) {
        conversation = await this.prisma.conversation.create({
          data: {
            tenantId: tenant.id,
            customerId: customer.id,
            channel: channel as any,
            state: {},
          },
        })
      }

      // שמור את ההודעה
      await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: direction as any,
          content,
          messageType: 'TEXT',
          status: direction === 'OUTBOUND' ? 'SENT' : 'DELIVERED',
        },
      })

      // עדכן זמן הודעה אחרונה
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      })
    } catch (err) {
      this.logger.error('Failed to save message to history', err)
      // אל תזרוק — לא רוצים לשבור את הצ'אטבוט בגלל בעיית שמירה
    }
  }
}
