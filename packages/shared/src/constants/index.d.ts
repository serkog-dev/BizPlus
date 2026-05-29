export declare enum AppointmentStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    NO_SHOW = "NO_SHOW"
}
export declare enum UserRole {
    OWNER = "OWNER",
    MANAGER = "MANAGER",
    PROVIDER = "PROVIDER",
    RECEPTIONIST = "RECEPTIONIST"
}
export declare enum AdminRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    SUPPORT = "SUPPORT",
    VIEWER = "VIEWER"
}
export declare enum Channel {
    WHATSAPP = "WHATSAPP",
    SMS = "SMS",
    TELEGRAM = "TELEGRAM",
    EMAIL = "EMAIL"
}
export declare enum PlanType {
    BASIC = "BASIC",
    PROFESSIONAL = "PROFESSIONAL",
    ENTERPRISE = "ENTERPRISE"
}
export declare enum SubscriptionStatus {
    TRIAL = "TRIAL",
    ACTIVE = "ACTIVE",
    PAST_DUE = "PAST_DUE",
    CANCELLED = "CANCELLED",
    SUSPENDED = "SUSPENDED"
}
export declare enum AppointmentSource {
    WHATSAPP = "WHATSAPP",
    SMS = "SMS",
    TELEGRAM = "TELEGRAM",
    DASHBOARD = "DASHBOARD",
    WALK_IN = "WALK_IN"
}
export declare enum CustomerSource {
    WHATSAPP = "WHATSAPP",
    SMS = "SMS",
    TELEGRAM = "TELEGRAM",
    MANUAL = "MANUAL",
    IMPORT = "IMPORT"
}
export declare const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string>;
export declare const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string>;
export declare const PLAN_DETAILS: Record<PlanType, {
    name: string;
    monthlyPrice: number;
    maxAppointments: number;
    maxUsers: number;
    maxLocations: number;
    maxMessages: number;
}>;
export declare const DAYS_OF_WEEK_HE: string[];
export declare const DEFAULT_TIMEZONE = "Asia/Jerusalem";
export declare const DEFAULT_CURRENCY = "ILS";
export declare const DEFAULT_LOCALE = "he-IL";
