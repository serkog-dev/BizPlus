import { AppointmentStatus, AppointmentSource, Channel, CustomerSource, PlanType, SubscriptionStatus, UserRole, AdminRole } from '../constants';
export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface Tenant extends BaseEntity {
    name: string;
    slug: string;
    email: string;
    phone: string;
    logoUrl?: string;
    brandColors?: {
        primary: string;
        secondary: string;
    };
    timezone: string;
    currency: string;
    plan: PlanType;
    isActive: boolean;
    onboardingCompleted: boolean;
    settings: TenantSettings;
}
export interface TenantSettings {
    appointmentBuffer: number;
    minBookAhead: number;
    maxBookAhead: number;
    cancellationDeadline: number;
    requireConfirmation: boolean;
    sendReminders: boolean;
    reminder24h: boolean;
    reminder1h: boolean;
    defaultDuration: number;
    messageLanguage: 'he' | 'en' | 'ar';
    messageSignature: string;
}
export interface Location extends BaseEntity {
    tenantId: string;
    name: string;
    address: string;
    phone?: string;
    email?: string;
    isDefault: boolean;
    isActive: boolean;
}
export interface User extends BaseEntity {
    tenantId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    avatarUrl?: string;
    role: UserRole;
    isActive: boolean;
    lastLoginAt?: Date;
}
export type UserWithoutPassword = Omit<User, never>;
export interface Provider extends BaseEntity {
    userId: string;
    tenantId: string;
    bio?: string;
    color: string;
    sortOrder: number;
    commissionType: 'NONE' | 'PERCENTAGE' | 'FIXED';
    commissionRate: number;
    user?: UserWithoutPassword;
    services?: Service[];
    locations?: Location[];
}
export interface Service extends BaseEntity {
    tenantId: string;
    name: string;
    description?: string;
    duration: number;
    price: number;
    currency: string;
    bufferBefore: number;
    bufferAfter: number;
    maxBookAhead: number;
    minBookAhead: number;
    isActive: boolean;
    isPublic: boolean;
    sortOrder: number;
    requireDeposit: boolean;
    depositPercent: number;
    category?: string;
    imageUrl?: string;
}
export interface Customer extends BaseEntity {
    tenantId: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    whatsappId?: string;
    telegramId?: string;
    dateOfBirth?: Date;
    tags: string[];
    source: CustomerSource;
    preferredChannel?: Channel;
    preferredProviderId?: string;
    notes?: string;
    isActive: boolean;
    totalAppointments: number;
    totalSpent: number;
    cancelRate: number;
    lastVisitAt?: Date;
}
export interface Appointment extends BaseEntity {
    tenantId: string;
    locationId: string;
    customerId: string;
    providerId: string;
    serviceId: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    status: AppointmentStatus;
    price: number;
    currency: string;
    depositAmount: number;
    depositPaid: boolean;
    source: AppointmentSource;
    notes?: string;
    internalNotes?: string;
    cancelledAt?: Date;
    cancelReason?: string;
    cancelledBy?: string;
    recurrenceId?: string;
    customer?: Customer;
    provider?: Provider;
    service?: Service;
    location?: Location;
}
export interface Schedule {
    id: string;
    providerId: string;
    locationId?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isWorking: boolean;
}
export interface ScheduleBreak {
    id: string;
    providerId: string;
    dayOfWeek?: number;
    startTime: string;
    endTime: string;
    specificDate?: Date;
    allDay: boolean;
    reason?: string;
}
export interface TimeSlot {
    startTime: string;
    endTime: string;
    providerId: string;
    providerName: string;
    available: boolean;
}
export interface AvailabilityQuery {
    tenantId?: string;
    tenantSlug?: string;
    serviceId: string;
    providerId?: string;
    locationId?: string;
    date: string;
    days?: number;
}
export interface Conversation extends BaseEntity {
    tenantId: string;
    customerId: string;
    channel: Channel;
    state: ConversationState;
    lastMessageAt: Date;
    customer?: Customer;
}
export interface ConversationState {
    step: string;
    selectedServiceId?: string;
    selectedProviderId?: string;
    selectedDate?: string;
    selectedTime?: string;
    tempCustomerName?: string;
    tempCustomerPhone?: string;
}
export interface Message extends BaseEntity {
    conversationId: string;
    direction: 'INBOUND' | 'OUTBOUND';
    content: string;
    messageType: 'TEXT' | 'INTERACTIVE' | 'TEMPLATE';
    externalId?: string;
    status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
}
export interface AdminUser extends BaseEntity {
    email: string;
    firstName: string;
    lastName: string;
    role: AdminRole;
    isActive: boolean;
    lastLoginAt?: Date;
}
export interface Subscription extends BaseEntity {
    tenantId: string;
    plan: PlanType;
    status: SubscriptionStatus;
    trialEndsAt?: Date;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    monthlyPrice: number;
    currency: string;
    cancelledAt?: Date;
    cancelReason?: string;
    tenant?: Tenant;
}
export interface Invoice extends BaseEntity {
    subscriptionId: string;
    tenantId: string;
    amount: number;
    currency: string;
    status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
    invoiceNumber: string;
    paidAt?: Date;
    dueDate: Date;
    paymentMethod?: string;
    receiptUrl?: string;
}
export interface UsageLog {
    id: string;
    tenantId: string;
    month: string;
    appointmentsCount: number;
    messagesCount: number;
    activeCustomers: number;
    activeUsers: number;
    createdAt: Date;
}
export interface DashboardTodayStats {
    date: string;
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    pendingAppointments: number;
    noShowAppointments: number;
    totalRevenue: number;
    newCustomers: number;
    returningCustomers: number;
}
export interface AdminDashboardStats {
    totalTenants: number;
    activeTenants: number;
    trialTenants: number;
    mrr: number;
    totalAppointmentsToday: number;
    totalMessagesToday: number;
    newTenantsThisMonth: number;
    churnRate: number;
}
