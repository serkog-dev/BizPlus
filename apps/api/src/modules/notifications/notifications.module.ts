import { Module } from '@nestjs/common'
import { DatabaseModule } from '../../database/database.module'
import { ChatbotModule } from '../chatbot/chatbot.module'
import { NotificationsService } from './notifications.service'

@Module({
  imports: [
    DatabaseModule,
    ChatbotModule, // מספק WhatsappService
  ],
  providers: [NotificationsService],
})
export class NotificationsModule {}
