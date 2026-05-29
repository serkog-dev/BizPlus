"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_LOCALE = exports.DEFAULT_CURRENCY = exports.DEFAULT_TIMEZONE = exports.DAYS_OF_WEEK_HE = exports.PLAN_DETAILS = exports.APPOINTMENT_STATUS_LABELS = exports.APPOINTMENT_STATUS_COLORS = exports.CustomerSource = exports.AppointmentSource = exports.SubscriptionStatus = exports.PlanType = exports.Channel = exports.AdminRole = exports.UserRole = exports.AppointmentStatus = void 0;
var AppointmentStatus;
(function (AppointmentStatus) {
    AppointmentStatus["PENDING"] = "PENDING";
    AppointmentStatus["CONFIRMED"] = "CONFIRMED";
    AppointmentStatus["COMPLETED"] = "COMPLETED";
    AppointmentStatus["CANCELLED"] = "CANCELLED";
    AppointmentStatus["NO_SHOW"] = "NO_SHOW";
})(AppointmentStatus || (exports.AppointmentStatus = AppointmentStatus = {}));
var UserRole;
(function (UserRole) {
    UserRole["OWNER"] = "OWNER";
    UserRole["MANAGER"] = "MANAGER";
    UserRole["PROVIDER"] = "PROVIDER";
    UserRole["RECEPTIONIST"] = "RECEPTIONIST";
})(UserRole || (exports.UserRole = UserRole = {}));
var AdminRole;
(function (AdminRole) {
    AdminRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    AdminRole["SUPPORT"] = "SUPPORT";
    AdminRole["VIEWER"] = "VIEWER";
})(AdminRole || (exports.AdminRole = AdminRole = {}));
var Channel;
(function (Channel) {
    Channel["WHATSAPP"] = "WHATSAPP";
    Channel["SMS"] = "SMS";
    Channel["TELEGRAM"] = "TELEGRAM";
    Channel["EMAIL"] = "EMAIL";
})(Channel || (exports.Channel = Channel = {}));
var PlanType;
(function (PlanType) {
    PlanType["BASIC"] = "BASIC";
    PlanType["PROFESSIONAL"] = "PROFESSIONAL";
    PlanType["ENTERPRISE"] = "ENTERPRISE";
})(PlanType || (exports.PlanType = PlanType = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["TRIAL"] = "TRIAL";
    SubscriptionStatus["ACTIVE"] = "ACTIVE";
    SubscriptionStatus["PAST_DUE"] = "PAST_DUE";
    SubscriptionStatus["CANCELLED"] = "CANCELLED";
    SubscriptionStatus["SUSPENDED"] = "SUSPENDED";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var AppointmentSource;
(function (AppointmentSource) {
    AppointmentSource["WHATSAPP"] = "WHATSAPP";
    AppointmentSource["SMS"] = "SMS";
    AppointmentSource["TELEGRAM"] = "TELEGRAM";
    AppointmentSource["DASHBOARD"] = "DASHBOARD";
    AppointmentSource["WALK_IN"] = "WALK_IN";
})(AppointmentSource || (exports.AppointmentSource = AppointmentSource = {}));
var CustomerSource;
(function (CustomerSource) {
    CustomerSource["WHATSAPP"] = "WHATSAPP";
    CustomerSource["SMS"] = "SMS";
    CustomerSource["TELEGRAM"] = "TELEGRAM";
    CustomerSource["MANUAL"] = "MANUAL";
    CustomerSource["IMPORT"] = "IMPORT";
})(CustomerSource || (exports.CustomerSource = CustomerSource = {}));
exports.APPOINTMENT_STATUS_COLORS = {
    [AppointmentStatus.PENDING]: '#FFA726',
    [AppointmentStatus.CONFIRMED]: '#66BB6A',
    [AppointmentStatus.COMPLETED]: '#42A5F5',
    [AppointmentStatus.CANCELLED]: '#EF5350',
    [AppointmentStatus.NO_SHOW]: '#9E9E9E',
};
exports.APPOINTMENT_STATUS_LABELS = {
    [AppointmentStatus.PENDING]: 'ממתין לאישור',
    [AppointmentStatus.CONFIRMED]: 'אושר',
    [AppointmentStatus.COMPLETED]: 'הושלם',
    [AppointmentStatus.CANCELLED]: 'בוטל',
    [AppointmentStatus.NO_SHOW]: 'לא הגיע',
};
exports.PLAN_DETAILS = {
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
        maxAppointments: -1,
        maxUsers: -1,
        maxLocations: -1,
        maxMessages: -1,
    },
};
exports.DAYS_OF_WEEK_HE = [
    'ראשון',
    'שני',
    'שלישי',
    'רביעי',
    'חמישי',
    'שישי',
    'שבת',
];
exports.DEFAULT_TIMEZONE = 'Asia/Jerusalem';
exports.DEFAULT_CURRENCY = 'ILS';
exports.DEFAULT_LOCALE = 'he-IL';
//# sourceMappingURL=index.js.map