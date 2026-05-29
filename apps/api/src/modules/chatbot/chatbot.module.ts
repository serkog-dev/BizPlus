import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from '../../database/database.module'
import { AppointmentsModule } from '../appointments/appointments.module'

import { ConversationService } from './conversation/conversation.service'
import { ConversationHistoryService } from './conversation/conversation-history.service'
import { BookingFlow } from './flows/booking.flow'
import { CancelFlow } from './flows/cancel.flow'
import { MyAppointmentsFlow } from './flows/my-appointments.flow'
import { ChatbotService } from './chatbot.service'
import { WhatsappService } from './whatsapp/whatsapp.service'
import { WhatsappController } from './whatsapp/whatsapp.controller'
import { ChatbotController } from './chatbot.controller'

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AppointmentsModule, // מספק AvailabilityService ו-BookingService
  ],
  controllers: [WhatsappController, ChatbotController],
  providers: [
    ConversationService,
    ConversationHistoryService,
    BookingFlow,
    CancelFlow,
    MyAppointmentsFlow,
    ChatbotService,
    WhatsappService,
  ],
  exports: [ChatbotService, WhatsappService, ConversationHistoryService],
})
export class ChatbotModule {}
