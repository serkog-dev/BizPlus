"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUpdateSubscriptionSchema = exports.AdminUpdateTenantSchema = exports.AvailabilityQuerySchema = exports.PublicBookingSchema = exports.UpdateAppointmentStatusSchema = exports.CreateAppointmentSchema = exports.UpdateCustomerSchema = exports.CreateCustomerSchema = exports.UpdateScheduleSchema = exports.ScheduleItemSchema = exports.TimeStringSchema = exports.CreateProviderSchema = exports.UpdateServiceSchema = exports.CreateServiceSchema = exports.UpdateTenantSchema = exports.AdminLoginSchema = exports.LoginSchema = exports.RegisterSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("../constants");
exports.RegisterSchema = zod_1.z.object({
    businessName: zod_1.z.string().min(2, 'שם העסק חייב להכיל לפחות 2 תווים'),
    businessPhone: zod_1.z.string().regex(/^0[0-9]{8,9}$/, 'מספר טלפון לא תקין'),
    businessEmail: zod_1.z.string().email('כתובת אימייל לא תקינה'),
    firstName: zod_1.z.string().min(2, 'שם פרטי חייב להכיל לפחות 2 תווים'),
    lastName: zod_1.z.string().min(2, 'שם משפחה חייב להכיל לפחות 2 תווים'),
    email: zod_1.z.string().email('כתובת אימייל לא תקינה'),
    password: zod_1.z.string().min(8, 'הסיסמה חייבת להכיל לפחות 8 תווים'),
});
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email('כתובת אימייל לא תקינה'),
    password: zod_1.z.string().min(1, 'סיסמה נדרשת'),
});
exports.AdminLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.UpdateTenantSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    phone: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional(),
    logoUrl: zod_1.z.string().url().optional().nullable(),
    brandColors: zod_1.z.object({
        primary: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        secondary: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    }).optional(),
    settings: zod_1.z.object({
        appointmentBuffer: zod_1.z.number().min(0).max(120).optional(),
        minBookAhead: zod_1.z.number().min(0).optional(),
        maxBookAhead: zod_1.z.number().min(1).max(365).optional(),
        cancellationDeadline: zod_1.z.number().min(0).optional(),
        requireConfirmation: zod_1.z.boolean().optional(),
        sendReminders: zod_1.z.boolean().optional(),
        reminder24h: zod_1.z.boolean().optional(),
        reminder1h: zod_1.z.boolean().optional(),
        defaultDuration: zod_1.z.number().min(5).max(480).optional(),
        messageLanguage: zod_1.z.enum(['he', 'en', 'ar']).optional(),
        messageSignature: zod_1.z.string().max(200).optional(),
    }).optional(),
});
exports.CreateServiceSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'שם השירות חייב להכיל לפחות 2 תווים'),
    description: zod_1.z.string().optional(),
    duration: zod_1.z.number().min(5, 'משך מינימלי 5 דקות').max(480, 'משך מקסימלי 8 שעות'),
    price: zod_1.z.number().min(0, 'מחיר לא יכול להיות שלילי'),
    bufferBefore: zod_1.z.number().min(0).max(60).default(0),
    bufferAfter: zod_1.z.number().min(0).max(60).default(0),
    isPublic: zod_1.z.boolean().default(true),
    requireDeposit: zod_1.z.boolean().default(false),
    depositPercent: zod_1.z.number().min(0).max(100).default(0),
    category: zod_1.z.string().optional(),
    sortOrder: zod_1.z.number().default(0),
});
exports.UpdateServiceSchema = exports.CreateServiceSchema.partial();
exports.CreateProviderSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2),
    lastName: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().regex(/^0[0-9]{8,9}$/).optional(),
    role: zod_1.z.nativeEnum(constants_1.UserRole).default(constants_1.UserRole.PROVIDER),
    bio: zod_1.z.string().max(500).optional(),
    color: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#42A5F5'),
    serviceIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    locationIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
});
exports.TimeStringSchema = zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'פורמט שעה לא תקין (HH:MM)');
exports.ScheduleItemSchema = zod_1.z.object({
    dayOfWeek: zod_1.z.number().min(0).max(6),
    startTime: exports.TimeStringSchema,
    endTime: exports.TimeStringSchema,
    isWorking: zod_1.z.boolean(),
}).refine(data => {
    if (!data.isWorking)
        return true;
    return data.startTime < data.endTime;
}, { message: 'שעת הסיום חייבת להיות אחרי שעת ההתחלה' });
exports.UpdateScheduleSchema = zod_1.z.object({
    schedule: zod_1.z.array(exports.ScheduleItemSchema).length(7, 'חייב לכלול 7 ימי שבוע'),
});
exports.CreateCustomerSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2, 'שם פרטי חייב להכיל לפחות 2 תווים'),
    lastName: zod_1.z.string().min(2, 'שם משפחה חייב להכיל לפחות 2 תווים'),
    phone: zod_1.z.string().regex(/^0[0-9]{8,9}$/, 'מספר טלפון לא תקין'),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    dateOfBirth: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    preferredChannel: zod_1.z.nativeEnum(constants_1.Channel).optional(),
    notes: zod_1.z.string().max(1000).optional(),
});
exports.UpdateCustomerSchema = exports.CreateCustomerSchema.partial();
exports.CreateAppointmentSchema = zod_1.z.object({
    customerId: zod_1.z.string().uuid('מזהה לקוח לא תקין'),
    providerId: zod_1.z.string().uuid('מזהה נותן שירות לא תקין'),
    serviceId: zod_1.z.string().uuid('מזהה שירות לא תקין'),
    locationId: zod_1.z.string().uuid('מזהה סניף לא תקין'),
    startTime: zod_1.z.string().datetime('תאריך ושעה לא תקינים'),
    notes: zod_1.z.string().max(500).optional(),
    internalNotes: zod_1.z.string().max(500).optional(),
});
exports.UpdateAppointmentStatusSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(constants_1.AppointmentStatus),
    cancelReason: zod_1.z.string().optional(),
});
exports.PublicBookingSchema = zod_1.z.object({
    serviceId: zod_1.z.string().uuid(),
    providerId: zod_1.z.string().uuid().optional(),
    locationId: zod_1.z.string().uuid(),
    startTime: zod_1.z.string().datetime(),
    customerFirstName: zod_1.z.string().min(2, 'שם פרטי חייב להכיל לפחות 2 תווים'),
    customerLastName: zod_1.z.string().min(2, 'שם משפחה חייב להכיל לפחות 2 תווים'),
    customerPhone: zod_1.z.string().regex(/^0[0-9]{8,9}$/, 'מספר טלפון לא תקין'),
    customerEmail: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    notes: zod_1.z.string().max(500).optional(),
});
exports.AvailabilityQuerySchema = zod_1.z.object({
    serviceId: zod_1.z.string().uuid(),
    providerId: zod_1.z.string().uuid().optional(),
    locationId: zod_1.z.string().uuid(),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'פורמט תאריך לא תקין (YYYY-MM-DD)'),
    days: zod_1.z.coerce.number().min(1).max(30).default(7),
});
exports.AdminUpdateTenantSchema = zod_1.z.object({
    isActive: zod_1.z.boolean().optional(),
    plan: zod_1.z.nativeEnum(constants_1.PlanType).optional(),
    notes: zod_1.z.string().optional(),
});
exports.AdminUpdateSubscriptionSchema = zod_1.z.object({
    plan: zod_1.z.nativeEnum(constants_1.PlanType).optional(),
    status: zod_1.z.enum(['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'SUSPENDED']).optional(),
    trialEndsAt: zod_1.z.string().datetime().optional(),
    monthlyPrice: zod_1.z.number().min(0).optional(),
});
//# sourceMappingURL=index.js.map