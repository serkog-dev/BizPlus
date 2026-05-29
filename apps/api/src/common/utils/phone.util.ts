/**
 * ממיר מספר טלפון ישראלי לפורמט WhatsApp (972xxxxxxxxx)
 * 052-1234567  → 972521234567
 * 0521234567   → 972521234567
 * +9720521234567 → 9720521234567  (already international)
 * 972521234567 → 972521234567   (unchanged)
 */
export function normalizePhoneForWhatsapp(phone: string): string {
  // הסר כל תו שאינו ספרה
  let cleaned = phone.replace(/\D/g, '')

  // אם מתחיל ב-0 — מספר ישראלי מקומי → החלף ב-972
  if (cleaned.startsWith('0')) {
    cleaned = '972' + cleaned.slice(1)
  }

  return cleaned
}
