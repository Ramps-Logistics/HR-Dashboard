import { getQuery, createError } from 'h3'
import { loadEmployeesFromOdoo } from '../../utils/odooEmployees'
import { deriveCalendarEvents, type HrCalendarEvent } from '../../utils/hrCalendar'

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/
const DAY_MS = 86_400_000

function utcTodayYmd(): string {
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth() + 1
  const d = now.getUTCDate()
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function addDaysYmd(ymd: string, days: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd)
  if (!m) return ymd
  const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const next = new Date(ms + days * DAY_MS)
  const y = next.getUTCFullYear()
  const mo = next.getUTCMonth() + 1
  const da = next.getUTCDate()
  return `${y}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}`
}

export default defineEventHandler(async (event): Promise<{
  from: string
  to: string
  events: HrCalendarEvent[]
}> => {
  const q = getQuery(event)
  const today = utcTodayYmd()
  const fromRaw = typeof q.from === 'string' ? q.from : ''
  const toRaw = typeof q.to === 'string' ? q.to : ''
  const fromYmd = YMD_RE.test(fromRaw) ? fromRaw : addDaysYmd(today, -14)
  const toYmd = YMD_RE.test(toRaw) ? toRaw : addDaysYmd(today, 90)

  if (fromYmd > toYmd) {
    throw createError({ statusCode: 400, statusMessage: '`from` must be on or before `to`.' })
  }

  const employees = await loadEmployeesFromOdoo()
  const events = deriveCalendarEvents(employees, { fromYmd, toYmd })
  return { from: fromYmd, to: toYmd, events }
})
