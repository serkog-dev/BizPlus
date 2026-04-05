import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from '../constants'

// ===== DATE FORMATTING (Hebrew) =====

export function formatDateHebrew(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString(DEFAULT_LOCALE, {
    timeZone: DEFAULT_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatTimeHebrew(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleTimeString(DEFAULT_LOCALE, {
    timeZone: DEFAULT_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatDateTimeHebrew(date: Date | string): string {
  return `${formatDateHebrew(date)} בשעה ${formatTimeHebrew(date)}`
}

export function formatCurrencyHebrew(amount: number): string {
  return `₪${amount.toLocaleString(DEFAULT_LOCALE, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

// ===== SLUG GENERATION =====
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9א-ת\s-]/g, '')
    .replace(/[\sא-ת]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || `business-${Date.now()}`
}

// ===== TIME UTILITIES =====

/** Convert "HH:mm" string to minutes from midnight */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/** Convert minutes from midnight to "HH:mm" string */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0')
  const m = (minutes % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

/** Get next N days as YYYY-MM-DD strings */
export function getNextDays(fromDate: Date, count: number): string[] {
  const days: string[] = []
  for (let i = 0; i < count; i++) {
    const d = new Date(fromDate)
    d.setDate(d.getDate() + i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

// ===== PHONE NORMALIZATION =====
export function normalizeIsraeliPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('972')) return `0${digits.slice(3)}`
  if (digits.startsWith('0')) return digits
  return digits
}

export function phoneToWhatsAppId(phone: string): string {
  const normalized = normalizeIsraeliPhone(phone)
  return `972${normalized.slice(1)}@c.us`
}

// ===== PAGINATION =====
export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

// ===== API RESPONSE =====
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message }
}

export function errorResponse(error: string): ApiResponse {
  return { success: false, error }
}
