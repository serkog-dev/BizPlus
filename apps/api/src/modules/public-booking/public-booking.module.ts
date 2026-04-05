import { Module } from '@nestjs/common'
import { PublicBookingController } from './public-booking.controller'
import { AppointmentsModule } from '../appointments/appointments.module'
@Module({ imports: [AppointmentsModule], controllers: [PublicBookingController] })
export class PublicBookingModule {}
