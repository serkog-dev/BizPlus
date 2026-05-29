import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { AppointmentsGateway } from './appointments.gateway'
import { CreateAppointmentDto, PublicBookingDto } from '@bizplus/shared'
import { EventEmitter2 } from '@nestjs/event-emitter'

@Injectable()
export class BookingService {
  constructor(
    private prisma: PrismaService,
    private gateway: AppointmentsGateway,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Book an appointment with double-booking prevention.
   * Uses PostgreSQL advisory locks to serialize concurrent bookings
   * for the same provider on the same day.
   */
  async createAppointment(tenantId: string, dto: CreateAppointmentDto, source: string = 'DASHBOARD') {
    const startTime = new Date(dto.startTime)

    // Load service to calculate end time
    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, tenantId, isActive: true },
    })
    if (!service) throw new NotFoundException('השירות לא נמצא')

    const endTime = new Date(startTime.getTime() + service.duration * 60 * 1000)
    const dateStr = startTime.toISOString().split('T')[0].replace(/-/g, '')

    // Advisory lock key: provider + date (serializes concurrent bookings for same provider/day)
    const lockKey = this.hashString(`${dto.providerId}:${dateStr}`)

    let appointment: any

    try {
      await this.prisma.$transaction(async (tx) => {
        // Acquire advisory lock - blocks concurrent bookings for same provider+date
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey}::bigint)`

        // Check for overlapping non-cancelled appointments
        const overlap = await tx.appointment.findFirst({
          where: {
            providerId: dto.providerId,
            status: { notIn: ['CANCELLED'] },
            // Overlap condition: existing.start < newEnd AND existing.end > newStart
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
        })

        if (overlap) {
          throw new ConflictException(
            'הזמן שבחרת כבר תפוס. אנא בחר זמן אחר.'
          )
        }

        // Verify provider, customer, and location belong to tenant
        const [provider, customer, location] = await Promise.all([
          tx.provider.findFirst({ where: { id: dto.providerId, tenantId } }),
          tx.customer.findFirst({ where: { id: dto.customerId, tenantId } }),
          tx.location.findFirst({ where: { id: dto.locationId, tenantId } }),
        ])

        if (!provider) throw new NotFoundException('נותן השירות לא נמצא')
        if (!customer) throw new NotFoundException('הלקוח לא נמצא')
        if (!location) throw new NotFoundException('הסניף לא נמצא')

        // Calculate deposit if required
        const depositAmount = service.requireDeposit
          ? (Number(service.price) * Number(service.depositPercent)) / 100
          : 0

        appointment = await tx.appointment.create({
          data: {
            tenantId,
            locationId: dto.locationId,
            customerId: dto.customerId,
            providerId: dto.providerId,
            serviceId: dto.serviceId,
            startTime,
            endTime,
            duration: service.duration,
            status: 'PENDING',
            price: service.price,
            depositAmount,
            source: source as any,
            notes: dto.notes,
            internalNotes: dto.internalNotes,
          },
          include: {
            customer: true,
            provider: { include: { user: true } },
            service: true,
            location: true,
          },
        })

        // Update customer stats
        await tx.customer.update({
          where: { id: dto.customerId },
          data: { totalAppointments: { increment: 1 } },
        })

        // Audit log
        await tx.auditLog.create({
          data: {
            tenantId,
            action: 'appointment.created',
            entity: 'Appointment',
            entityId: appointment.id,
            changes: { source, serviceId: dto.serviceId },
          },
        })
      }, {
        timeout: 10000, // 10 second timeout
      })
    } catch (error) {
      if (error instanceof ConflictException) throw error
      if (error instanceof NotFoundException) throw error
      if (error instanceof BadRequestException) throw error
      throw error
    }

    // Emit real-time event to all connected clients of this tenant
    this.gateway.emitToTenant(tenantId, 'appointment:created', appointment)
    this.gateway.emitToTenant(tenantId, 'availability:changed', {
      providerId: dto.providerId,
      date: startTime.toISOString().split('T')[0],
    })

    // Emit domain event for notifications (e.g. WhatsApp confirmation)
    this.eventEmitter.emit('appointment.created', { appointment, source })

    return appointment
  }

  /**
   * Public booking (from chatbot or public page) - creates or finds customer first
   */
  async publicBook(tenantSlug: string, dto: PublicBookingDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantSlug, isActive: true },
    })
    if (!tenant) throw new NotFoundException('העסק לא נמצא')

    // Find or create customer by phone
    let customer = await this.prisma.customer.findFirst({
      where: { tenantId: tenant.id, phone: dto.customerPhone },
    })

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          tenantId: tenant.id,
          firstName: dto.customerFirstName,
          lastName: dto.customerLastName,
          phone: dto.customerPhone,
          email: dto.customerEmail || null,
          source: 'WHATSAPP', // assume WhatsApp for public booking
        },
      })
    }

    // If no specific provider requested, find the first available one
    let providerId = dto.providerId
    if (!providerId) {
      const ps = await this.prisma.providerService.findFirst({
        where: {
          serviceId: dto.serviceId,
          provider: { tenantId: tenant.id },
        },
      })
      if (!ps) throw new NotFoundException('לא נמצא נותן שירות זמין')
      providerId = ps.providerId
    }

    return this.createAppointment(
      tenant.id,
      {
        customerId: customer.id,
        providerId: providerId!,
        serviceId: dto.serviceId,
        locationId: dto.locationId,
        startTime: dto.startTime,
        notes: dto.notes,
      },
      'WHATSAPP',
    )
  }

  /**
   * Update appointment status with business rules
   */
  async updateStatus(
    tenantId: string,
    appointmentId: string,
    status: string,
    cancelReason?: string,
  ) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, tenantId },
    })
    if (!appointment) throw new NotFoundException('התור לא נמצא')

    // Business rules for status transitions
    const allowedTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
      COMPLETED: [],      // Terminal state
      CANCELLED: [],      // Terminal state
      NO_SHOW: [],        // Terminal state
    }

    const allowed = allowedTransitions[appointment.status] || []
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `לא ניתן לשנות סטטוס מ-${appointment.status} ל-${status}`
      )
    }

    const updateData: any = {
      status,
      ...(status === 'CANCELLED' && {
        cancelledAt: new Date(),
        cancelReason: cancelReason || null,
      }),
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        customer: true,
        provider: { include: { user: true } },
        service: true,
        location: true,
      },
    })

    // Update customer stats on completion/cancellation
    if (status === 'COMPLETED') {
      await this.prisma.customer.update({
        where: { id: appointment.customerId },
        data: {
          totalSpent: { increment: Number(appointment.price) },
          lastVisitAt: new Date(),
        },
      })
    }

    // Emit real-time update
    this.gateway.emitToTenant(tenantId, 'appointment:status-changed', {
      id: appointmentId,
      oldStatus: appointment.status,
      newStatus: status,
      appointment: updated,
    })

    // Emit domain event for notifications (e.g. WhatsApp cancellation notice)
    if (status === 'CANCELLED') {
      this.eventEmitter.emit('appointment.cancelled', { appointment: updated })
    }

    return updated
  }

  /** Simple non-cryptographic hash for advisory lock key */
  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit int
    }
    return Math.abs(hash)
  }
}
