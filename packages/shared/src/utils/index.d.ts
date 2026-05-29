export declare function formatDateHebrew(date: Date | string): string;
export declare function formatTimeHebrew(date: Date | string): string;
export declare function formatDateTimeHebrew(date: Date | string): string;
export declare function formatCurrencyHebrew(amount: number): string;
export declare function generateSlug(name: string): string;
export declare function timeToMinutes(time: string): number;
export declare function minutesToTime(minutes: number): string;
export declare function getNextDays(fromDate: Date, count: number): string[];
export declare function normalizeIsraeliPhone(phone: string): string;
export declare function phoneToWhatsAppId(phone: string): string;
export interface PaginationParams {
    page?: number;
    limit?: number;
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare function buildPaginatedResponse<T>(data: T[], total: number, page: number, limit: number): PaginatedResponse<T>;
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
export declare function successResponse<T>(data: T, message?: string): ApiResponse<T>;
export declare function errorResponse(error: string): ApiResponse;
