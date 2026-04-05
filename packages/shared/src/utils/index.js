"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDateHebrew = formatDateHebrew;
exports.formatTimeHebrew = formatTimeHebrew;
exports.formatDateTimeHebrew = formatDateTimeHebrew;
exports.formatCurrencyHebrew = formatCurrencyHebrew;
exports.generateSlug = generateSlug;
exports.timeToMinutes = timeToMinutes;
exports.minutesToTime = minutesToTime;
exports.getNextDays = getNextDays;
exports.normalizeIsraeliPhone = normalizeIsraeliPhone;
exports.phoneToWhatsAppId = phoneToWhatsAppId;
exports.buildPaginatedResponse = buildPaginatedResponse;
exports.successResponse = successResponse;
exports.errorResponse = errorResponse;
const constants_1 = require("../constants");
function formatDateHebrew(date) {
    const d = new Date(date);
    return d.toLocaleDateString(constants_1.DEFAULT_LOCALE, {
        timeZone: constants_1.DEFAULT_TIMEZONE,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}
function formatTimeHebrew(date) {
    const d = new Date(date);
    return d.toLocaleTimeString(constants_1.DEFAULT_LOCALE, {
        timeZone: constants_1.DEFAULT_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}
function formatDateTimeHebrew(date) {
    return `${formatDateHebrew(date)} בשעה ${formatTimeHebrew(date)}`;
}
function formatCurrencyHebrew(amount) {
    return `₪${amount.toLocaleString(constants_1.DEFAULT_LOCALE, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
function generateSlug(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9א-ת\s-]/g, '')
        .replace(/[\sא-ת]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        || `business-${Date.now()}`;
}
function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}
function minutesToTime(minutes) {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
}
function getNextDays(fromDate, count) {
    const days = [];
    for (let i = 0; i < count; i++) {
        const d = new Date(fromDate);
        d.setDate(d.getDate() + i);
        days.push(d.toISOString().split('T')[0]);
    }
    return days;
}
function normalizeIsraeliPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('972'))
        return `0${digits.slice(3)}`;
    if (digits.startsWith('0'))
        return digits;
    return digits;
}
function phoneToWhatsAppId(phone) {
    const normalized = normalizeIsraeliPhone(phone);
    return `972${normalized.slice(1)}@c.us`;
}
function buildPaginatedResponse(data, total, page, limit) {
    return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}
function successResponse(data, message) {
    return { success: true, data, message };
}
function errorResponse(error) {
    return { success: false, error };
}
//# sourceMappingURL=index.js.map