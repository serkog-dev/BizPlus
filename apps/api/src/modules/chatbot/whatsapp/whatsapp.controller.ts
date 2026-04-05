import { Controller, Get, Post, Body, Query, Res, Logger, Param } from '@nestjs/common'
import { Response } from 'express'
import { WhatsappService } from './whatsapp.service'
import { ChatbotService } from '../chatbot.service'
import { ConversationHistoryService } from '../conversation/conversation-history.service'

@Controller('webhooks/whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name)

  constructor(
    private whatsappService: WhatsappService,
    private chatbotService: ChatbotService,
    private historyService: ConversationHistoryService,
  ) {}

  // Meta webhook verification (GET)
  @Get()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const result = this.whatsappService.verifyWebhook(mode, token, challenge)
    if (result) {
      return res.status(200).send(result)
    }
    return res.status(403).send('Forbidden')
  }

  // הודעות נכנסות (POST) — דרך /webhooks/whatsapp/:tenantSlug
  @Post(':tenantSlug')
  async receive(
    @Param('tenantSlug') tenantSlug: string,
    @Body() body: any,
    @Res() res: Response,
  ) {
    // Meta מצפה ל-200 מיידי
    res.status(200).send('OK')

    const messages = this.whatsappService.extractMessages(body)
    for (const msg of messages) {
      try {
        // שמור הודעה נכנסת
        await this.historyService.saveMessage({
          tenantSlug, phone: msg.phone, direction: 'INBOUND', content: msg.text,
        })
        const reply = await this.chatbotService.processMessage(tenantSlug, msg.phone, msg.text)
        await this.whatsappService.sendText(msg.phone, reply)
        // שמור הודעה יוצאת
        await this.historyService.saveMessage({
          tenantSlug, phone: msg.phone, direction: 'OUTBOUND', content: reply,
        })
      } catch (err) {
        this.logger.error(`Error processing message from ${msg.phone}`, err)
      }
    }
  }

  // endpoint גנרי — Meta קושר ל-/webhooks/whatsapp ובלי tenantSlug
  @Post()
  async receiveGeneric(@Body() body: any, @Res() res: Response) {
    res.status(200).send('OK')

    const messages = this.whatsappService.extractMessages(body)
    for (const msg of messages) {
      try {
        const tenantSlug = process.env.DEFAULT_TENANT_SLUG ?? 'demo'
        await this.historyService.saveMessage({
          tenantSlug, phone: msg.phone, direction: 'INBOUND', content: msg.text,
        })
        const reply = await this.chatbotService.processMessage(tenantSlug, msg.phone, msg.text)
        await this.whatsappService.sendText(msg.phone, reply)
        await this.historyService.saveMessage({
          tenantSlug, phone: msg.phone, direction: 'OUTBOUND', content: reply,
        })
      } catch (err) {
        this.logger.error(`Error processing message from ${msg.phone}`, err)
      }
    }
  }
}
