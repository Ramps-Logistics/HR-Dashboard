export type HrCalendarEventType = 'birthday' | 'anniversary' | 'contract_end' | 'probation_end'

export const HR_CALENDAR_EVENT_TYPES: readonly HrCalendarEventType[] = [
  'birthday',
  'anniversary',
  'contract_end',
  'probation_end'
]

export type HrCalendarEvent = {
  id: string
  type: HrCalendarEventType
  date: string
  employeeKey: string
  employeeName: string
  countryAssigned: string
  department: string
  position: string
  yearsOfService?: number
  age?: number
}

export type AlertTier = 'today' | '2_days' | '1_week' | '2_weeks'

export const ALERT_TIER_ORDER: readonly AlertTier[] = ['today', '2_days', '1_week', '2_weeks']

const DAY_MS = 86_400_000

export function utcTodayMs(now: Date = new Date()): number {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
}

export function ymdToUtcMs(ymd: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const da = Number(m[3])
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(da)) return null
  return Date.UTC(y, mo - 1, da)
}

export function daysUntil(eventYmd: string, todayMs: number = utcTodayMs()): number | null {
  const ms = ymdToUtcMs(eventYmd)
  if (ms === null) return null
  return Math.floor((ms - todayMs) / DAY_MS)
}

export function alertTierFor(daysUntilValue: number): AlertTier | null {
  if (daysUntilValue === 0) return 'today'
  if (daysUntilValue >= 1 && daysUntilValue <= 2) return '2_days'
  if (daysUntilValue >= 3 && daysUntilValue <= 7) return '1_week'
  if (daysUntilValue >= 8 && daysUntilValue <= 14) return '2_weeks'
  return null
}

export function tierLabel(tier: AlertTier): string {
  if (tier === 'today') return 'Today'
  if (tier === '2_days') return 'Within 2 days'
  if (tier === '1_week') return 'Within 1 week'
  return 'Within 2 weeks'
}

export type GroupedAlerts = Record<AlertTier, HrCalendarEvent[]>

export function groupAlertsByTier(
  events: readonly HrCalendarEvent[],
  todayMs: number = utcTodayMs()
): GroupedAlerts {
  const out: GroupedAlerts = { today: [], '2_days': [], '1_week': [], '2_weeks': [] }
  for (const e of events) {
    const d = daysUntil(e.date, todayMs)
    if (d === null) continue
    const tier = alertTierFor(d)
    if (tier) out[tier].push(e)
  }
  return out
}

export function eventTitle(e: HrCalendarEvent): string {
  if (e.type === 'birthday') {
    return e.age != null ? `${e.employeeName} turns ${e.age}` : `${e.employeeName}'s birthday`
  }
  if (e.type === 'anniversary') {
    if (e.yearsOfService == null) return `${e.employeeName} work anniversary`
    const noun = e.yearsOfService === 1 ? 'year' : 'years'
    return `${e.employeeName} — ${e.yearsOfService} ${noun} at Ramps`
  }
  if (e.type === 'contract_end') return `${e.employeeName} — contract end`
  return `${e.employeeName} — probation end`
}

export function eventTypeLabel(type: HrCalendarEventType): string {
  if (type === 'birthday') return 'Birthday'
  if (type === 'anniversary') return 'Work anniversary'
  if (type === 'contract_end') return 'Contract end'
  return 'Probation end'
}

export type EventTypeStyle = {
  /** Tailwind utility classes for a small badge / chip. */
  badge: string
  /** Tailwind utility class for a solid dot used in calendar cells. */
  dot: string
}

const TYPE_STYLES: Record<HrCalendarEventType, EventTypeStyle> = {
  birthday: { badge: 'border-pink-200 bg-pink-50 text-pink-800', dot: 'bg-pink-500' },
  anniversary: { badge: 'border-purple-200 bg-purple-50 text-brand-purple', dot: 'bg-brand-purple' },
  contract_end: { badge: 'border-blue-200 bg-blue-50 text-blue-900', dot: 'bg-blue-600' },
  probation_end: { badge: 'border-teal-200 bg-teal-50 text-teal-800', dot: 'bg-teal-600' }
}

export function eventTypeStyle(type: HrCalendarEventType): EventTypeStyle {
  return TYPE_STYLES[type]
}

export type EventTypeCounts = Record<HrCalendarEventType, number>

/**
 * Count events per type. Useful for filter-chip badges.
 */
export function countEventsByType(events: readonly HrCalendarEvent[]): EventTypeCounts {
  const out: EventTypeCounts = { birthday: 0, anniversary: 0, contract_end: 0, probation_end: 0 }
  for (const e of events) out[e.type]++
  return out
}

/**
 * Filter events to the selected type set. An empty set means "no filter" and
 * returns all events untouched (a copy, to keep call sites pure).
 */
export function filterEventsByType(
  events: readonly HrCalendarEvent[],
  selected: ReadonlySet<HrCalendarEventType>
): HrCalendarEvent[] {
  if (selected.size === 0) return [...events]
  return events.filter((e) => selected.has(e.type))
}

/**
 * Events whose date is today (UTC).
 */
export function eventsToday(
  events: readonly HrCalendarEvent[],
  todayMs: number = utcTodayMs()
): HrCalendarEvent[] {
  return events.filter((e) => daysUntil(e.date, todayMs) === 0)
}

export type UpcomingDayGroup = {
  /** YYYY-MM-DD for the group. */
  ymd: string
  /** Days from today to this group (1..14). */
  daysUntil: number
  events: HrCalendarEvent[]
}

/**
 * Group future events (1..14 days from today) by date, sorted ascending.
 * Same-day events keep the order they came in (which is already
 * server-sorted by name → type).
 */
export function groupUpcomingByDay(
  events: readonly HrCalendarEvent[],
  todayMs: number = utcTodayMs()
): UpcomingDayGroup[] {
  const byDate = new Map<string, UpcomingDayGroup>()
  for (const e of events) {
    const d = daysUntil(e.date, todayMs)
    if (d === null || d < 1 || d > 14) continue
    const existing = byDate.get(e.date)
    if (existing) {
      existing.events.push(e)
    } else {
      byDate.set(e.date, { ymd: e.date, daysUntil: d, events: [e] })
    }
  }
  return Array.from(byDate.values()).sort((a, b) => a.ymd.localeCompare(b.ymd))
}

/**
 * "Today" / "Tomorrow" / "In N days". Negative or out-of-range values
 * fall back to "In N days".
 */
export function relativeDaysLabel(daysUntilValue: number): string {
  if (daysUntilValue === 0) return 'Today'
  if (daysUntilValue === 1) return 'Tomorrow'
  return `In ${daysUntilValue} days`
}

export type AlertSection = 'today' | 'tomorrow' | 'this_week' | 'next_week'

export const ALERT_SECTION_ORDER: readonly AlertSection[] = [
  'today',
  'tomorrow',
  'this_week',
  'next_week'
]

/**
 * Map an event's date to one of the drawer sections, using Sunday-start
 * calendar weeks.
 *
 * - `today`     = today's date
 * - `tomorrow`  = day after today
 * - `this_week` = remaining days of the current calendar week, after tomorrow
 *                 (i.e. up to the Saturday of this week)
 * - `next_week` = the full next calendar week (Sun..Sat)
 *
 * Anything outside that window returns `null` and is omitted from the drawer
 * (still visible on the calendar grid).
 */
export function alertSectionFor(eventYmd: string, todayMs: number = utcTodayMs()): AlertSection | null {
  const d = daysUntil(eventYmd, todayMs)
  if (d === null || d < 0) return null
  if (d === 0) return 'today'
  if (d === 1) return 'tomorrow'

  // Calendar-week boundaries with Sunday as day 0.
  const dow = new Date(todayMs).getUTCDay()
  const daysUntilEndOfThisWeek = 6 - dow
  const daysUntilStartOfNextWeek = daysUntilEndOfThisWeek + 1
  const daysUntilEndOfNextWeek = daysUntilStartOfNextWeek + 6

  if (d <= daysUntilEndOfThisWeek) return 'this_week'
  if (d >= daysUntilStartOfNextWeek && d <= daysUntilEndOfNextWeek) return 'next_week'
  return null
}

export function alertSectionLabel(section: AlertSection): string {
  if (section === 'today') return 'Today'
  if (section === 'tomorrow') return 'Tomorrow'
  if (section === 'this_week') return 'This week'
  return 'Next week'
}

export type GroupedDrawerAlerts = Record<AlertSection, HrCalendarEvent[]>

/**
 * Bucket events into the four drawer sections. Events outside today through
 * end-of-next-week are dropped because they're not part of the alerts surface.
 */
export function groupAlertsForDrawer(
  events: readonly HrCalendarEvent[],
  todayMs: number = utcTodayMs()
): GroupedDrawerAlerts {
  const out: GroupedDrawerAlerts = { today: [], tomorrow: [], this_week: [], next_week: [] }
  for (const e of events) {
    const section = alertSectionFor(e.date, todayMs)
    if (section) out[section].push(e)
  }
  return out
}

const SHORT_DATE_FMT = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC'
})

/**
 * Compact date label used in timelines, e.g. "Mon 18 May".
 */
export function shortDateLabel(ymd: string): string {
  const ms = ymdToUtcMs(ymd)
  if (ms === null) return ymd
  return SHORT_DATE_FMT.format(new Date(ms))
}
