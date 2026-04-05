import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class ConversationsService {
  constructor(private prisma: PrismaService) {}

  // רשימת שיחות עם הודעה אחרונה
  async findAll(tenantId: string, page = 1, limit = 30) {
    const skip = (page - 1) * limit

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: { tenantId },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { content: true, direction: true, createdAt: true },
          },
        },
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.conversation.count({ where: { tenantId } }),
    ])

    // צרף הודעה אחרונה לכל שיחה
    const data = conversations.map(c => ({
      id: c.id,
      channel: c.channel,
      lastMessageAt: c.lastMessageAt,
      customer: c.customer,
      lastMessage: c.messages[0] ?? null,
    }))

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  // כל ההודעות בשיחה מסוימת
  async findMessages(tenantId: string, conversationId: string, page = 1, limit = 50) {
    // וודא שהשיחה שייכת לtenant הזה
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    })
    if (!conversation) return null

    const skip = (page - 1) * limit
    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ])

    return {
      conversation,
      messages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }
}
