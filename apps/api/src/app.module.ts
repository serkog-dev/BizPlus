import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { ScheduleModule } from '@nestjs/schedule'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { RedisModule } from '@nestjs-modules/ioredis'
import { DatabaseModule } from './database/database.module'
import { AuthModule } from './modules/auth/auth.module'
import { TenantsModule } from './modules/tenants/tenants.module'
import { LocationsModule } from './modules/locations/locations.module'
import { ServicesModule } from './modules/services/services.module'
import { ProvidersModule } from './modules/providers/providers.module'
import { CustomersModule } from './modules/customers/customers.module'
import { AppointmentsModule } from './modules/appointments/appointments.module'
import { DashboardModule } from './modules/dashboard/dashboard.module'
import { PublicBookingModule } from './modules/public-booking/public-booking.module'
import { AdminModule } from './modules/admin/admin.module'
import { ChatbotModule } from './modules/chatbot/chatbot.module'
import { RemindersModule } from './modules/reminders/reminders.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { ConversationsModule } from './modules/conversations/conversations.module'

@Module({
  imports: [
    // Config - loads .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),

    // Cron jobs (reminders)
    ScheduleModule.forRoot(),

    // Domain events (notifications)
    EventEmitterModule.forRoot(),

    // Rate limiting
    ThrottlerModule.forRoot([{
      name: 'short',
      ttl: 60000,   // 1 minute
      limit: 100,   // 100 requests per minute (authenticated)
    }]),

    // Redis (for chatbot conversation state)
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'single',
        url: config.get('REDIS_URL') ?? 'redis://localhost:6379',
      }),
    }),

    // Database (Prisma)
    DatabaseModule,

    // Feature modules
    AuthModule,
    TenantsModule,
    LocationsModule,
    ServicesModule,
    ProvidersModule,
    CustomersModule,
    AppointmentsModule,
    DashboardModule,
    PublicBookingModule,
    AdminModule,
    ChatbotModule,
    RemindersModule,
    NotificationsModule,
    ConversationsModule,
  ],
})
export class AppModule {}
