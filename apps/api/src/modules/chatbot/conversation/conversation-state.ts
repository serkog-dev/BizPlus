// מצבי השיחה — כל לקוח נמצא באחד מהמצבים האלה בכל רגע
export enum ConversationStep {
  IDLE = 'IDLE',                         // לא בתהליך
  AWAITING_NAME = 'AWAITING_NAME',       // לקוח חדש — מחכים לשם
  AWAITING_SERVICE = 'AWAITING_SERVICE', // בחירת שירות
  AWAITING_PROVIDER = 'AWAITING_PROVIDER', // בחירת נותן שירות
  AWAITING_DATE = 'AWAITING_DATE',       // בחירת תאריך
  AWAITING_TIME = 'AWAITING_TIME',       // בחירת שעה
  AWAITING_CONFIRM = 'AWAITING_CONFIRM', // אישור התור
  AWAITING_CANCEL_CONFIRM = 'AWAITING_CANCEL_CONFIRM', // אישור ביטול
}

export interface ConversationContext {
  tenantSlug: string
  phone: string
  step: ConversationStep
  customerName?: string          // שם שהלקוח נתן בשיחה הראשונה
  pendingIntent?: string         // הכוונה שהייתה לפני שאלת השם
  // נתונים שנאספו במהלך השיחה
  selectedServiceId?: string
  selectedServiceName?: string
  selectedProviderId?: string
  selectedProviderName?: string
  selectedDate?: string        // YYYY-MM-DD
  selectedTime?: string        // HH:mm
  selectedLocationId?: string
  appointmentIdToCancel?: string
  customerId?: string
  // רשימות זמניות (מה שהצגנו ללקוח)
  shownServices?: Array<{ id: string; name: string; duration: number; price: number }>
  shownProviders?: Array<{ id: string; name: string }>
  shownSlots?: string[]
  shownSlotProviders?: string[]  // provider IDs מקבילים לshownSlots
  shownAppointments?: Array<{ id: string; label: string }>
}
