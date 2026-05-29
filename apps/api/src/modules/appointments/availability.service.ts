import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { timeToMinutes, minutesToTime } from '@bizplus/shared'

export interface AvailableSlot {
  startTime: string   // ISO datetime
  endTime: string     // ISO datetime
  providerId: string
  providerName: string
  providerColor: string
}

export interface ComputeAvailabilityParams {
  tenantId: string
  serviceId: string
  locationId: string
  date: string          // YYYY-MM-DD
  providerId?: string   // optional - if not set, check all providers for the service
}

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  /**
   * Compute available time slots for a given service, location, and date.
   * Takes into account:
   * - Provider working hours (schedule)
   * - Existing appointments (including buffer times)
   * - Schedule breaks and blocked days
   * - Service buffer before/after
   */
  async getAvailableSlots(params: ComputeAvailabilityParams): Promise<AvailableSlot[]> {
    const { tenantId, serviceId, locationId, date, providerId } = params

    // Load service details
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, tenantId, isActive: true },
    })
    if (!service) return []

    const totalDuration = service.duration + Number(service.bufferBefore) + Number(service.bufferAfter)

    // Get providers for this service (filtered by providerId if specified)
    const providerServices = await this.prisma.providerService.findMany({
      where: {
        serviceId,
        ...(providerId ? { providerId } : {}),
        provider: { tenantId, providerLocations: { some: { locationId } } },
      },
      include: {
        provider: {
          include: { user: true },
        },
      },
    })

    if (providerServices.length === 0) return []

    const allSlots: AvailableSlot[] = []

    // Convert date string to day of week (0=Sunday)
    const targetDate = new Date(date + 'T00:00:00.000Z')
    const dayOfWeek = targetDate.getUTCDay()

    for (const ps of providerServices) {
      const provider = ps.provider
      const slots = await this.computeSlotsForProvider({
        provider,
        service,
        locationId,
        date,
        targetDate,
        dayOfWeek,
        totalDuration,
      })
      allSlots.push(...slots)
    }

    // Sort by time
    return allSlots.sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  private async computeSlotsForProvider({
    provider,
    service,
    locationId,
    date,
    targetDate,
    dayOfWeek,
    totalDuration,
  }: {
    provider: any
    service: any
    locationId: string
    date: string
    targetDate: Date
    dayOfWeek: number
    totalDuration: number
  }): Promise<AvailableSlot[]> {
    // 1. Get working schedule for this day
    const schedule = await this.prisma.schedule.findFirst({
      where: {
        providerId: provider.id,
        dayOfWeek,
        OR: [{ locationId }, { locationId: null }],
        isWorking: true,
      },
    })

    if (!schedule) return [] // Provider doesn't work this day

    // 2. Get existing appointments for this provider on this date
    const dayStart = new Date(`${date}T00:00:00.000Z`)
    const dayEnd = new Date(`${date}T23:59:59.999Z`)

    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        providerId: provider.id,
        status: { notIn: ['CANCELLED'] },
        startTime: { gte: dayStart },
        endTime: { lte: dayEnd },
      },
      select: {
        startTime: true,
        endTime: true,
        service: { select: { bufferAfter: true } },
      },
      orderBy: { startTime: 'asc' },
    })

    // 3. Get breaks for this day
    const breaks = await this.prisma.scheduleBreak.findMany({
      where: {
        providerId: provider.id,
        OR: [
          { specificDate: { gte: dayStart, lte: dayEnd } },
          { dayOfWeek, specificDate: null },
        ],
      },
    })

    // 4. Check if provider has an all-day break
    const hasAllDayBreak = breaks.some(b => b.allDay)
    if (hasAllDayBreak) return []

    // 5. Build busy time ranges (appointments + breaks) in minutes from midnight
    const busyRanges: Array<{ start: number; end: number }> = []

    for (const appt of existingAppointments) {
      const startMin = this.dateToMinutesFromMidnight(appt.startTime, date)
      // Include buffer after in the busy range
      const endMin = this.dateToMinutesFromMidnight(appt.endTime, date)
        + Number(appt.service?.bufferAfter || 0)
      busyRanges.push({ start: startMin, end: endMin })
    }

    for (const brk of breaks) {
      if (!brk.allDay) {
        busyRanges.push({
          start: timeToMinutes(brk.startTime),
          end: timeToMinutes(brk.endTime),
        })
      }
    }

    // 6. Generate candidate slots
    const workStart = timeToMinutes(schedule.startTime)
    const workEnd = timeToMinutes(schedule.endTime)
    const bufferBefore = Number(service.bufferBefore)
    const slotInterval = 15 // offer slots every 15 minutes

    const availableSlots: AvailableSlot[] = []

    // Start from now + minBookAhead hours if today
    const now = new Date()
    const isToday = date === now.toISOString().split('T')[0]
    let earliestStart = workStart

    if (isToday) {
      const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes()
      const minBookAhead = Number(service.minBookAhead) * 60 // hours to minutes
      earliestStart = Math.max(workStart, currentMinutes + minBookAhead)
      // Round up to nearest slot interval
      earliestStart = Math.ceil(earliestStart / slotInterval) * slotInterval
    }

    for (let slotStart = earliestStart; slotStart + totalDuration <= workEnd; slotStart += slotInterval) {
      const effectiveStart = slotStart + bufferBefore // actual appointment start
      const slotEnd = slotStart + totalDuration

      // Check if this slot overlaps with any busy range
      const isOverlapping = busyRanges.some(
        busy => !(slotEnd <= busy.start || slotStart >= busy.end)
      )

      if (!isOverlapping) {
        const startISO = this.minutesFromMidnightToISO(effectiveStart, date)
        const endISO = this.minutesFromMidnightToISO(effectiveStart + service.duration, date)

        availableSlots.push({
          startTime: startISO,
          endTime: endISO,
          providerId: provider.id,
          providerName: `${provider.user.firstName} ${provider.user.lastName}`,
          providerColor: provider.color,
        })
      }
    }

    return availableSlots
  }

  private dateToMinutesFromMidnight(date: Date, dateStr: string): number {
    const d = new Date(date)
    return d.getUTCHours() * 60 + d.getUTCMinutes()
  }

  private minutesFromMidnightToISO(minutes: number, dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number)
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return new Date(Date.UTC(year, month - 1, day, hours, mins)).toISOString()
  }
}
