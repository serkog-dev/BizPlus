import { Module } from '@nestjs/common'
import { DatabaseModule } from '../../database/database.module'
import { AuthModule } from '../auth/auth.module'
import { ConversationsService } from './conversations.service'
import { ConversationsController } from './conversations.controller'

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [ConversationsController],
  providers: [ConversationsService],
})
export class ConversationsModule {}
