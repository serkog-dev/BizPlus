import { z } from 'zod';
import { AppointmentStatus, Channel, PlanType, UserRole } from '../constants';
export declare const RegisterSchema: z.ZodObject<{
    businessName: z.ZodString;
    businessPhone: z.ZodString;
    businessEmail: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    firstName: string;
    lastName: string;
    businessName: string;
    businessPhone: string;
    businessEmail: string;
    password: string;
}, {
    email: string;
    firstName: string;
    lastName: string;
    businessName: string;
    businessPhone: string;
    businessEmail: string;
    password: string;
}>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const AdminLoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const UpdateTenantSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    logoUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    brandColors: z.ZodOptional<z.ZodObject<{
        primary: z.ZodString;
        secondary: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        primary: string;
        secondary: string;
    }, {
        primary: string;
        secondary: string;
    }>>;
    settings: z.ZodOptional<z.ZodObject<{
        appointmentBuffer: z.ZodOptional<z.ZodNumber>;
        minBookAhead: z.ZodOptional<z.ZodNumber>;
        maxBookAhead: z.ZodOptional<z.ZodNumber>;
        cancellationDeadline: z.ZodOptional<z.ZodNumber>;
        requireConfirmation: z.ZodOptional<z.ZodBoolean>;
        sendReminders: z.ZodOptional<z.ZodBoolean>;
        reminder24h: z.ZodOptional<z.ZodBoolean>;
        reminder1h: z.ZodOptional<z.ZodBoolean>;
        defaultDuration: z.ZodOptional<z.ZodNumber>;
        messageLanguage: z.ZodOptional<z.ZodEnum<["he", "en", "ar"]>>;
        messageSignature: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        maxBookAhead?: number | undefined;
        minBookAhead?: number | undefined;
        appointmentBuffer?: number | undefined;
        cancellationDeadline?: number | undefined;
        requireConfirmation?: boolean | undefined;
        sendReminders?: boolean | undefined;
        reminder24h?: boolean | undefined;
        reminder1h?: boolean | undefined;
        defaultDuration?: number | undefined;
        messageLanguage?: "he" | "en" | "ar" | undefined;
        messageSignature?: string | undefined;
    }, {
        maxBookAhead?: number | undefined;
        minBookAhead?: number | undefined;
        appointmentBuffer?: number | undefined;
        cancellationDeadline?: number | undefined;
        requireConfirmation?: boolean | undefined;
        sendReminders?: boolean | undefined;
        reminder24h?: boolean | undefined;
        reminder1h?: boolean | undefined;
        defaultDuration?: number | undefined;
        messageLanguage?: "he" | "en" | "ar" | undefined;
        messageSignature?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    name?: string | undefined;
    phone?: string | undefined;
    logoUrl?: string | null | undefined;
    brandColors?: {
        primary: string;
        secondary: string;
    } | undefined;
    settings?: {
        maxBookAhead?: number | undefined;
        minBookAhead?: number | undefined;
        appointmentBuffer?: number | undefined;
        cancellationDeadline?: number | undefined;
        requireConfirmation?: boolean | undefined;
        sendReminders?: boolean | undefined;
        reminder24h?: boolean | undefined;
        reminder1h?: boolean | undefined;
        defaultDuration?: number | undefined;
        messageLanguage?: "he" | "en" | "ar" | undefined;
        messageSignature?: string | undefined;
    } | undefined;
}, {
    email?: string | undefined;
    name?: string | undefined;
    phone?: string | undefined;
    logoUrl?: string | null | undefined;
    brandColors?: {
        primary: string;
        secondary: string;
    } | undefined;
    settings?: {
        maxBookAhead?: number | undefined;
        minBookAhead?: number | undefined;
        appointmentBuffer?: number | undefined;
        cancellationDeadline?: number | undefined;
        requireConfirmation?: boolean | undefined;
        sendReminders?: boolean | undefined;
        reminder24h?: boolean | undefined;
        reminder1h?: boolean | undefined;
        defaultDuration?: number | undefined;
        messageLanguage?: "he" | "en" | "ar" | undefined;
        messageSignature?: string | undefined;
    } | undefined;
}>;
export declare const CreateServiceSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    duration: z.ZodNumber;
    price: z.ZodNumber;
    bufferBefore: z.ZodDefault<z.ZodNumber>;
    bufferAfter: z.ZodDefault<z.ZodNumber>;
    isPublic: z.ZodDefault<z.ZodBoolean>;
    requireDeposit: z.ZodDefault<z.ZodBoolean>;
    depositPercent: z.ZodDefault<z.ZodNumber>;
    category: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    sortOrder: number;
    duration: number;
    price: number;
    bufferBefore: number;
    bufferAfter: number;
    isPublic: boolean;
    requireDeposit: boolean;
    depositPercent: number;
    description?: string | undefined;
    category?: string | undefined;
}, {
    name: string;
    duration: number;
    price: number;
    sortOrder?: number | undefined;
    description?: string | undefined;
    bufferBefore?: number | undefined;
    bufferAfter?: number | undefined;
    isPublic?: boolean | undefined;
    requireDeposit?: boolean | undefined;
    depositPercent?: number | undefined;
    category?: string | undefined;
}>;
export declare const UpdateServiceSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    duration: z.ZodOptional<z.ZodNumber>;
    price: z.ZodOptional<z.ZodNumber>;
    bufferBefore: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    bufferAfter: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    isPublic: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    requireDeposit: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    depositPercent: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    category: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    sortOrder: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    sortOrder?: number | undefined;
    description?: string | undefined;
    duration?: number | undefined;
    price?: number | undefined;
    bufferBefore?: number | undefined;
    bufferAfter?: number | undefined;
    isPublic?: boolean | undefined;
    requireDeposit?: boolean | undefined;
    depositPercent?: number | undefined;
    category?: string | undefined;
}, {
    name?: string | undefined;
    sortOrder?: number | undefined;
    description?: string | undefined;
    duration?: number | undefined;
    price?: number | undefined;
    bufferBefore?: number | undefined;
    bufferAfter?: number | undefined;
    isPublic?: boolean | undefined;
    requireDeposit?: boolean | undefined;
    depositPercent?: number | undefined;
    category?: string | undefined;
}>;
export declare const CreateProviderSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    role: z.ZodDefault<z.ZodNativeEnum<typeof UserRole>>;
    bio: z.ZodOptional<z.ZodString>;
    color: z.ZodDefault<z.ZodString>;
    serviceIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    locationIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    color: string;
    phone?: string | undefined;
    bio?: string | undefined;
    serviceIds?: string[] | undefined;
    locationIds?: string[] | undefined;
}, {
    email: string;
    firstName: string;
    lastName: string;
    role?: UserRole | undefined;
    phone?: string | undefined;
    bio?: string | undefined;
    color?: string | undefined;
    serviceIds?: string[] | undefined;
    locationIds?: string[] | undefined;
}>;
export declare const TimeStringSchema: z.ZodString;
export declare const ScheduleItemSchema: z.ZodEffects<z.ZodObject<{
    dayOfWeek: z.ZodNumber;
    startTime: z.ZodString;
    endTime: z.ZodString;
    isWorking: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    startTime: string;
    endTime: string;
    dayOfWeek: number;
    isWorking: boolean;
}, {
    startTime: string;
    endTime: string;
    dayOfWeek: number;
    isWorking: boolean;
}>, {
    startTime: string;
    endTime: string;
    dayOfWeek: number;
    isWorking: boolean;
}, {
    startTime: string;
    endTime: string;
    dayOfWeek: number;
    isWorking: boolean;
}>;
export declare const UpdateScheduleSchema: z.ZodObject<{
    schedule: z.ZodArray<z.ZodEffects<z.ZodObject<{
        dayOfWeek: z.ZodNumber;
        startTime: z.ZodString;
        endTime: z.ZodString;
        isWorking: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        startTime: string;
        endTime: string;
        dayOfWeek: number;
        isWorking: boolean;
    }, {
        startTime: string;
        endTime: string;
        dayOfWeek: number;
        isWorking: boolean;
    }>, {
        startTime: string;
        endTime: string;
        dayOfWeek: number;
        isWorking: boolean;
    }, {
        startTime: string;
        endTime: string;
        dayOfWeek: number;
        isWorking: boolean;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    schedule: {
        startTime: string;
        endTime: string;
        dayOfWeek: number;
        isWorking: boolean;
    }[];
}, {
    schedule: {
        startTime: string;
        endTime: string;
        dayOfWeek: number;
        isWorking: boolean;
    }[];
}>;
export declare const CreateCustomerSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    phone: z.ZodString;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    dateOfBirth: z.ZodOptional<z.ZodString>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    preferredChannel: z.ZodOptional<z.ZodNativeEnum<typeof Channel>>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    firstName: string;
    lastName: string;
    phone: string;
    tags: string[];
    email?: string | undefined;
    dateOfBirth?: string | undefined;
    preferredChannel?: Channel | undefined;
    notes?: string | undefined;
}, {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string | undefined;
    dateOfBirth?: string | undefined;
    tags?: string[] | undefined;
    preferredChannel?: Channel | undefined;
    notes?: string | undefined;
}>;
export declare const UpdateCustomerSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    dateOfBirth: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    tags: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    preferredChannel: z.ZodOptional<z.ZodOptional<z.ZodNativeEnum<typeof Channel>>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    dateOfBirth?: string | undefined;
    tags?: string[] | undefined;
    preferredChannel?: Channel | undefined;
    notes?: string | undefined;
}, {
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    dateOfBirth?: string | undefined;
    tags?: string[] | undefined;
    preferredChannel?: Channel | undefined;
    notes?: string | undefined;
}>;
export declare const CreateAppointmentSchema: z.ZodObject<{
    customerId: z.ZodString;
    providerId: z.ZodString;
    serviceId: z.ZodString;
    locationId: z.ZodString;
    startTime: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
    internalNotes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    providerId: string;
    locationId: string;
    serviceId: string;
    customerId: string;
    startTime: string;
    notes?: string | undefined;
    internalNotes?: string | undefined;
}, {
    providerId: string;
    locationId: string;
    serviceId: string;
    customerId: string;
    startTime: string;
    notes?: string | undefined;
    internalNotes?: string | undefined;
}>;
export declare const UpdateAppointmentStatusSchema: z.ZodObject<{
    status: z.ZodNativeEnum<typeof AppointmentStatus>;
    cancelReason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: AppointmentStatus;
    cancelReason?: string | undefined;
}, {
    status: AppointmentStatus;
    cancelReason?: string | undefined;
}>;
export declare const PublicBookingSchema: z.ZodObject<{
    serviceId: z.ZodString;
    providerId: z.ZodOptional<z.ZodString>;
    locationId: z.ZodString;
    startTime: z.ZodString;
    customerFirstName: z.ZodString;
    customerLastName: z.ZodString;
    customerPhone: z.ZodString;
    customerEmail: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    locationId: string;
    serviceId: string;
    startTime: string;
    customerFirstName: string;
    customerLastName: string;
    customerPhone: string;
    providerId?: string | undefined;
    notes?: string | undefined;
    customerEmail?: string | undefined;
}, {
    locationId: string;
    serviceId: string;
    startTime: string;
    customerFirstName: string;
    customerLastName: string;
    customerPhone: string;
    providerId?: string | undefined;
    notes?: string | undefined;
    customerEmail?: string | undefined;
}>;
export declare const AvailabilityQuerySchema: z.ZodObject<{
    serviceId: z.ZodString;
    providerId: z.ZodOptional<z.ZodString>;
    locationId: z.ZodString;
    date: z.ZodString;
    days: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    locationId: string;
    serviceId: string;
    date: string;
    days: number;
    providerId?: string | undefined;
}, {
    locationId: string;
    serviceId: string;
    date: string;
    providerId?: string | undefined;
    days?: number | undefined;
}>;
export declare const AdminUpdateTenantSchema: z.ZodObject<{
    isActive: z.ZodOptional<z.ZodBoolean>;
    plan: z.ZodOptional<z.ZodNativeEnum<typeof PlanType>>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    isActive?: boolean | undefined;
    plan?: PlanType | undefined;
    notes?: string | undefined;
}, {
    isActive?: boolean | undefined;
    plan?: PlanType | undefined;
    notes?: string | undefined;
}>;
export declare const AdminUpdateSubscriptionSchema: z.ZodObject<{
    plan: z.ZodOptional<z.ZodNativeEnum<typeof PlanType>>;
    status: z.ZodOptional<z.ZodEnum<["TRIAL", "ACTIVE", "PAST_DUE", "CANCELLED", "SUSPENDED"]>>;
    trialEndsAt: z.ZodOptional<z.ZodString>;
    monthlyPrice: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    plan?: PlanType | undefined;
    status?: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "SUSPENDED" | undefined;
    trialEndsAt?: string | undefined;
    monthlyPrice?: number | undefined;
}, {
    plan?: PlanType | undefined;
    status?: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "SUSPENDED" | undefined;
    trialEndsAt?: string | undefined;
    monthlyPrice?: number | undefined;
}>;
export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type CreateServiceDto = z.infer<typeof CreateServiceSchema>;
export type UpdateServiceDto = z.infer<typeof UpdateServiceSchema>;
export type CreateProviderDto = z.infer<typeof CreateProviderSchema>;
export type CreateCustomerDto = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerDto = z.infer<typeof UpdateCustomerSchema>;
export type CreateAppointmentDto = z.infer<typeof CreateAppointmentSchema>;
export type UpdateAppointmentStatusDto = z.infer<typeof UpdateAppointmentStatusSchema>;
export type PublicBookingDto = z.infer<typeof PublicBookingSchema>;
export type AvailabilityQueryDto = z.infer<typeof AvailabilityQuerySchema>;
