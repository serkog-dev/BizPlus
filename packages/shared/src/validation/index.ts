import { z } from 'zod'
import { AppointmentStatus, Channel, PlanType, UserRole } from '../constants'

// ===== AUTH =====
export const RegisterSchema = z.object({
  // Business info
  businessName: z.string().min(2, 'שם העסק חייב להכיל לפחות 2 תווים'),
  businessPhone: z.string().regex(/^0[0-9]{8,9}$/, 'מספר טלפון לא תקין'),
  businessEmail: z.string().email('כתובת אימייל לא תקינה'),
  // Owner info
  firstName: z.string().min(2, 'שם פרטי חייב להכיל לפחות 2 תווים'),
  lastName: z.string().min(2, 'שם משפחה חייב להכיל לפחות 2 תווים'),
  email: z.string().email('כתובת אימייל לא תקינה'),
  password: z.string().min(8, 'הסיסמה חייבת להכיל לפחות 8 תווים'),
})

export const LoginSchema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה'),
  password: z.string().min(1, 'סיסמה נדרשת'),
})

export const AdminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// ===== TENANT =====
export const UpdateTenantSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  logoUrl: z.string().url().optional().nullable(),
  brandColors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }).optional(),
  settings: z.object({
    appointmentBuffer: z.number().min(0).max(120).optional(),
    minBookAhead: z.number().min(0).optional(),
    maxBookAhead: z.number().min(1).max(365).optional(),
    cancellationDeadline: z.number().min(0).optional(),
    requireConfirmation: z.boolean().optional(),
    sendReminders: z.boolean().optional(),
    reminder24h: z.boolean().optional(),
    reminder1h: z.boolean().optional(),
    defaultDuration: z.number().min(5).max(480).optional(),
    messageLanguage: z.enum(['he', 'en', 'ar']).optional(),
    messageSignature: z.string().max(200).optional(),
  }).optional(),
})

// ===== SERVICE =====
export const CreateServiceSchema = z.object({
  name: z.string().min(2, 'שם השירות חייב להכיל לפחות 2 תווים'),
  description: z.string().optional(),
  duration: z.number().min(5, 'משך מינימלי 5 דקות').max(480, 'משך מקסימלי 8 שעות'),
  price: z.number().min(0, 'מחיר לא יכול להיות שלילי'),
  bufferBefore: z.number().min(0).max(60).default(0),
  bufferAfter: z.number().min(0).max(60).default(0),
  isPublic: z.boolean().default(true),
  requireDeposit: z.boolean().default(false),
  depositPercent: z.number().min(0).max(100).default(0),
  category: z.string().optional(),
  sortOrder: z.number().default(0),
})

export const UpdateServiceSchema = CreateServiceSchema.partial()

// ===== PROVIDER =====
export const CreateProviderSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().regex(/^0[0-9]{8,9}$/).optional(),
  role: z.nativeEnum(UserRole).default(UserRole.PROVIDER),
  bio: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#42A5F5'),
  serviceIds: z.array(z.string().uuid()).optional(),
  locationIds: z.array(z.string().uuid()).optional(),
})

// ===== SCHEDULE =====
export const TimeStringSchema = z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'פורמט שעה לא תקין (HH:MM)')

export const ScheduleItemSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: TimeStringSchema,
  endTime: TimeStringSchema,
  isWorking: z.boolean(),
}).refine(data => {
  if (!data.isWorking) return true
  return data.startTime < data.endTime
}, { message: 'שעת הסיום חייבת להיות אחרי שעת ההתחלה' })

export const UpdateScheduleSchema = z.object({
  schedule: z.array(ScheduleItemSchema).length(7, 'חייב לכלול 7 ימי שבוע'),
})

// ===== CUSTOMER =====
export const CreateCustomerSchema = z.object({
  firstName: z.string().min(2, 'שם פרטי חייב להכיל לפחות 2 תווים'),
  lastName: z.string().min(2, 'שם משפחה חייב להכיל לפחות 2 תווים'),
  phone: z.string().regex(/^0[0-9]{8,9}$/, 'מספר טלפון לא תקין'),
  email: z.string().email().optional().or(z.literal('')),
  dateOfBirth: z.string().optional(),
  tags: z.array(z.string()).default([]),
  preferredChannel: z.nativeEnum(Channel).optional(),
  notes: z.string().max(1000).optional(),
})

export const UpdateCustomerSchema = CreateCustomerSchema.partial()

// ===== APPOINTMENT =====
export const CreateAppointmentSchema = z.object({
  customerId: z.string().uuid('מזהה לקוח לא תקין'),
  providerId: z.string().uuid('מזהה נותן שירות לא תקין'),
  serviceId: z.string().uuid('מזהה שירות לא תקין'),
  locationId: z.string().uuid('מזהה סניף לא תקין'),
  startTime: z.string().datetime('תאריך ושעה לא תקינים'),
  notes: z.string().max(500).optional(),
  internalNotes: z.string().max(500).optional(),
})

export const UpdateAppointmentStatusSchema = z.object({
  status: z.nativeEnum(AppointmentStatus),
  cancelReason: z.string().optional(),
})

// ===== PUBLIC BOOKING =====
export const PublicBookingSchema = z.object({
  serviceId: z.string().uuid(),
  providerId: z.string().uuid().optional(),
  locationId: z.string().uuid(),
  startTime: z.string().datetime(),
  customerFirstName: z.string().min(2, 'שם פרטי חייב להכיל לפחות 2 תווים'),
  customerLastName: z.string().min(2, 'שם משפחה חייב להכיל לפחות 2 תווים'),
  customerPhone: z.string().regex(/^0[0-9]{8,9}$/, 'מספר טלפון לא תקין'),
  customerEmail: z.string().email().optional().or(z.literal('')),
  notes: z.string().max(500).optional(),
})

// ===== AVAILABILITY QUERY =====
export const AvailabilityQuerySchema = z.object({
  serviceId: z.string().uuid(),
  providerId: z.string().uuid().optional(),
  locationId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'פורמט תאריך לא תקין (YYYY-MM-DD)'),
  days: z.coerce.number().min(1).max(30).default(7),
})

// ===== ADMIN =====
export const AdminUpdateTenantSchema = z.object({
  isActive: z.boolean().optional(),
  plan: z.nativeEnum(PlanType).optional(),
  notes: z.string().optional(),
})

export const AdminUpdateSubscriptionSchema = z.object({
  plan: z.nativeEnum(PlanType).optional(),
  status: z.enum(['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'SUSPENDED']).optional(),
  trialEndsAt: z.string().datetime().optional(),
  monthlyPrice: z.number().min(0).optional(),
})

// ===== TYPE EXPORTS =====
export type RegisterDto = z.infer<typeof RegisterSchema>
export type LoginDto = z.infer<typeof LoginSchema>
export type CreateServiceDto = z.infer<typeof CreateServiceSchema>
export type UpdateServiceDto = z.infer<typeof UpdateServiceSchema>
export type CreateProviderDto = z.infer<typeof CreateProviderSchema>
export type CreateCustomerDto = z.infer<typeof CreateCustomerSchema>
export type UpdateCustomerDto = z.infer<typeof UpdateCustomerSchema>
export type CreateAppointmentDto = z.infer<typeof CreateAppointmentSchema>
export type UpdateAppointmentStatusDto = z.infer<typeof UpdateAppointmentStatusSchema>
export type PublicBookingDto = z.infer<typeof PublicBookingSchema>
export type AvailabilityQueryDto = z.infer<typeof AvailabilityQuerySchema>
