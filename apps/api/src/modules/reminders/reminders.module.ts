import { Module } from '@nestjs/common'
import { DatabaseModule } from '../../database/database.module'
import { ChatbotModule } from '../chatbot/chatbot.module'
import { RemindersService } from './reminders.service'

@Module({
  imports: [
    DatabaseModule,
    ChatbotModule, // מספק WhatsappService
  ],
  providers: [RemindersService],
})
export class RemindersModule {}
