// זיהוי כוונת המשתמש מטקסט עברי חופשי

export enum Intent {
  BOOK = 'BOOK',                   // קביעת תור
  CANCEL = 'CANCEL',               // ביטול תור
  MY_APPOINTMENTS = 'MY_APPOINTMENTS', // התורים שלי
  YES = 'YES',                     // כן / אישור
  NO = 'NO',                       // לא / ביטול
  HELP = 'HELP',                   // עזרה
  UNKNOWN = 'UNKNOWN',
}

// מילות מפתח לכל כוונה
const INTENT_KEYWORDS: Record<Intent, string[]> = {
  [Intent.BOOK]: [
    'תור', 'לקבוע', 'קבע', 'הזמן', 'להזמין', 'רוצה תור',
    'תורים', 'פגישה', 'לפגוש', 'להגיע', 'בוא', 'שריין',
    'book', 'appointment',
  ],
  [Intent.CANCEL]: [
    'בטל', 'ביטול', 'לבטל', 'מבטל', 'לא מגיע', 'לא אגיע',
    'לא יכול', 'cancel', 'להסיר',
  ],
  [Intent.MY_APPOINTMENTS]: [
    'התורים שלי', 'מתי התור', 'יש לי תור', 'הזמנות שלי',
    'מתי אני', 'תור שלי', 'הפגישות שלי', 'מה יש לי',
    'my appointments', 'הזמנה שלי',
  ],
  [Intent.YES]: [
    'כן', 'אישור', 'בסדר', 'אשר', 'נכון', 'יופי', 'מעולה',
    'ok', 'yes', 'sure', 'בטח', 'ברור', '👍', '✅',
  ],
  [Intent.NO]: [
    'לא', 'לא רוצה', 'ביטול', 'בטל', 'חזור', 'no', 'cancel',
    'לא תודה', '❌', '👎',
  ],
  [Intent.HELP]: [
    'עזרה', 'עזור', 'help', 'מה אפשר', 'מה יש', 'תפריט',
    'אפשרויות', 'שלום', 'היי', 'הי', 'hello', 'hi',
  ],
  [Intent.UNKNOWN]: [],
}

export function detectIntent(text: string): Intent {
  const normalized = text.trim().toLowerCase()

  // בדיקה ספציפית — MY_APPOINTMENTS לפני CANCEL כי "התורים שלי" כולל "תור"
  for (const intent of [
    Intent.MY_APPOINTMENTS,
    Intent.CANCEL,
    Intent.BOOK,
    Intent.YES,
    Intent.NO,
    Intent.HELP,
  ]) {
    const keywords = INTENT_KEYWORDS[intent]
    if (keywords.some(kw => normalized.includes(kw.toLowerCase()))) {
      return intent
    }
  }

  return Intent.UNKNOWN
}

// חילוץ מספר מתוך טקסט — למשל "1" או "בחירה 2"
export function extractNumber(text: string): number | null {
  const match = text.trim().match(/^(\d+)/)
  if (match) return parseInt(match[1], 10)

  // מספרים בכתב
  const wordMap: Record<string, number> = {
    'אחד': 1, 'שניים': 2, 'שלושה': 3, 'ארבעה': 4, 'חמישה': 5,
    'שש': 6, 'שבעה': 7, 'שמונה': 8, 'תשעה': 9, 'עשרה': 10,
  }
  for (const [word, num] of Object.entries(wordMap)) {
    if (text.includes(word)) return num
  }

  return null
}

// פרסור תאריך מטקסט עברי
export function parseHebrewDate(text: string): string | null {
  const today = new Date()

  if (text.includes('היום')) {
    return formatDate(today)
  }
  if (text.includes('מחר')) {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return formatDate(tomorrow)
  }
  if (text.includes('מחרתיים')) {
    const d = new Date(today)
    d.setDate(d.getDate() + 2)
    return formatDate(d)
  }

  // ימי שבוע
  const dayMap: Record<string, number> = {
    'ראשון': 0, 'שני': 1, 'שלישי': 2, 'רביעי': 3,
    'חמישי': 4, 'שישי': 5, 'שבת': 6,
  }
  for (const [dayName, dayNum] of Object.entries(dayMap)) {
    if (text.includes(dayName)) {
      const d = new Date(today)
      const diff = (dayNum - d.getDay() + 7) % 7 || 7
      d.setDate(d.getDate() + diff)
      return formatDate(d)
    }
  }

  // פורמט DD/MM
  const ddmm = text.match(/(\d{1,2})[\/\.\-](\d{1,2})/)
  if (ddmm) {
    const day = parseInt(ddmm[1])
    const month = parseInt(ddmm[2]) - 1
    const year = today.getFullYear()
    const d = new Date(year, month, day)
    return formatDate(d)
  }

  return null
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// פורמט תאריך לעברית
export function formatDateHebrew(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
}
