// ===== APPOINTMENT STATUSES =====
export enum AppointmentStatus {
  PENDING = 'PENDING',       // ממתין לאישור
  CONFIRMED = 'CONFIRMED',   // אושר
  COMPLETED = 'COMPLETED',   // הושלם
  CANCELLED = 'CANCELLED',   // בוטל
  NO_SHOW = 'NO_SHOW',       // לא הגיע
}

// ===== USER ROLES (Business staff) =====
export enum UserRole {
  OWNER = 'OWNER',             // בעל עסק - גישה מלאה
  MANAGER = 'MANAGER',         // מנהל - ניהול תורים ודוחות
  PROVIDER = 'PROVIDER',       // נותן שירות - רק התורים שלו
  RECEPTIONIST = 'RECEPTIONIST', // קבלה - הזמנת תורים בלבד
}

// ===== ADMIN ROLES (BizPlus platform) =====
export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN', // גישה מלאה לפלטפורמה
  SUPPORT = 'SUPPORT',         // צפייה ותמיכה
  VIEWER = 'VIEWER',           // צפייה בלבד
}

// ===== MESSAGING CHANNELS =====
export enum Channel {
  WHATSAPP = 'WHATSAPP',
  SMS = 'SMS',
  TELEGRAM = 'TELEGRAM',
  EMAIL = 'EMAIL',
}

// ===== SUBSCRIPTION PLANS =====
export enum PlanType {
  BASIC = 'BASIC',               // 99₪/חודש
  PROFESSIONAL = 'PROFESSIONAL', // 249₪/חודש
  ENTERPRISE = 'ENTERPRISE',     // 599₪/חודש
}

// ===== SUBSCRIPTION STATUS =====
export enum SubscriptionStatus {
  TRIAL = 'TRIAL',         // תקופת ניסיון
  ACTIVE = 'ACTIVE',       // פעיל
  PAST_DUE = 'PAST_DUE',   // חוב
  CANCELLED = 'CANCELLED', // בוטל
  SUSPENDED = 'SUSPENDED', // מושהה
}

// ===== APPOINTMENT SOURCE =====
export enum AppointmentSource {
  WHATSAPP = 'WHATSAPP',
  SMS = 'SMS',
  TELEGRAM = 'TELEGRAM',
  DASHBOARD = 'DASHBOARD',  // נקבע ע"י צוות
  WALK_IN = 'WALK_IN',      // לקוח שהגיע בלי הזמנה
}

// ===== CUSTOMER SOURCE =====
export enum CustomerSource {
  WHATSAPP = 'WHATSAPP',
  SMS = 'SMS',
  TELEGRAM = 'TELEGRAM',
  MANUAL = 'MANUAL',
  IMPORT = 'IMPORT',
}

// ===== APPOINTMENT STATUS COLORS (for UI) =====
export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: '#FFA726',    // כתום - ממתין
  [AppointmentStatus.CONFIRMED]: '#66BB6A',  // ירוק - אושר
  [AppointmentStatus.COMPLETED]: '#42A5F5',  // כחול - הושלם
  [AppointmentStatus.CANCELLED]: '#EF5350',  // אדום - בוטל
  [AppointmentStatus.NO_SHOW]: '#9E9E9E',    // אפור - לא הגיע
}

// ===== APPOINTMENT STATUS LABELS (Hebrew) =====
export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.PENDING]: 'ממתין לאישור',
  [AppointmentStatus.CONFIRMED]: 'אושר',
  [AppointmentStatus.COMPLETED]: 'הושלם',
  [AppointmentStatus.CANCELLED]: 'בוטל',
  [AppointmentStatus.NO_SHOW]: 'לא הגיע',
}

// ===== PLAN DETAILS =====
export const PLAN_DETAILS: Record<PlanType, {
  name: string;
  monthlyPrice: number;
  maxAppointments: number;
  maxUsers: number;
  maxLocations: number;
  maxMessages: number;
}> = {
  [PlanType.BASIC]: {
    name: 'Basic',
    monthlyPrice: 99,
    maxAppointments: 100,
    maxUsers: 1,
    maxLocations: 1,
    maxMessages: 100,
  },
  [PlanType.PROFESSIONAL]: {
    name: 'Professional',
    monthlyPrice: 249,
    maxAppointments: 500,
    maxUsers: 5,
    maxLocations: 1,
    maxMessages: 500,
  },
  [PlanType.ENTERPRISE]: {
    name: 'Enterprise',
    monthlyPrice: 599,
    maxAppointments: -1, // ללא הגבלה
    maxUsers: -1,
    maxLocations: -1,
    maxMessages: -1,
  },
}

// ===== DAYS OF WEEK (Hebrew, Sunday first - Israeli standard) =====
export const DAYS_OF_WEEK_HE = [
  'ראשון',  // 0
  'שני',    // 1
  'שלישי',  // 2
  'רביעי',  // 3
  'חמישי',  // 4
  'שישי',   // 5
  'שבת',    // 6
]

// ===== TIMEZONE =====
export const DEFAULT_TIMEZONE = 'Asia/Jerusalem'
export const DEFAULT_CURRENCY = 'ILS'
export const DEFAULT_LOCALE = 'he-IL'
