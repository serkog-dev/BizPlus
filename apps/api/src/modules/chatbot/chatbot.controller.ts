import { Controller, Post, Body, Param } from '@nestjs/common'
import { ChatbotService } from './chatbot.service'
import { ConversationHistoryService } from './conversation/conversation-history.service'

// בלבד לסביבת פיתוח — לבדיקת הצ'אטבוט בלי וואטסאפ אמיתי
@Controller('dev/chatbot')
export class ChatbotController {
  constructor(
    private chatbotService: ChatbotService,
    private historyService: ConversationHistoryService,
  ) {}

  @Post(':tenantSlug')
  async send(
    @Param('tenantSlug') tenantSlug: string,
    @Body() body: { phone: string; text: string },
  ) {
    const { phone, text } = body
    await this.historyService.saveMessage({ tenantSlug, phone, direction: 'INBOUND', content: text })
    const reply = await this.chatbotService.processMessage(tenantSlug, phone, text)
    await this.historyService.saveMessage({ tenantSlug, phone, direction: 'OUTBOUND', content: reply })
    return { reply }
  }
}
