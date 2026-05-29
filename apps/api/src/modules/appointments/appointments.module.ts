import { Module } from '@nestjs/common'
import { AppointmentsController } from './appointments.controller'
import { AppointmentsService } from './appointments.service'
import { AvailabilityService } from './availability.service'
import { BookingService } from './booking.service'
import { AppointmentsGateway } from './appointments.gateway'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [AppointmentsController],
  providers: [
    AppointmentsService,
    AvailabilityService,
    BookingService,
    AppointmentsGateway,
  ],
  exports: [AvailabilityService, BookingService],
})
export class AppointmentsModule {}
