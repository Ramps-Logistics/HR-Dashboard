import type { Employee } from './employees'
import { isActiveEmployeeStatus, isContractStyleEmployee } from './employeeClassification'

export type HrCalendarEventType = 'birthday' | 'anniversary' | 'contract_end' | 'probation_end'

export type HrCalendarEvent = {
  /** Stable id: `${employeeKey}__${type}__${date}`. */
  id: string
  type: HrCalendarEventType
  /** Occurrence date (YYYY-MM-DD) within the requested range. */
  date: string
  employeeKey: string
  employeeName: string
  countryAssigned: string
  department: string
  position: string
  /** Years of service for anniversaries (>= 1). */
  yearsOfService?: number
  /** Age the employee turns on the projected birthday. */
  age?: number
}

type Ymd = { y: number; m: number; d: number }

function parseYmd(ymd: string | null | undefined): Ymd | null {
  if (!ymd) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const da = Number(m[3])
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(da)) return null
  if (mo < 1 || mo > 12 || da < 1 || da > 31) return null
  return { y, m: mo, d: da }
}

function ymdToUtcMs(ymd: string): number | null {
  const p = parseYmd(ymd)
  if (!p) return null
  return Date.UTC(p.y, p.m - 1, p.d)
}

function utcMsToYmd(ms: number): string {
  const d = new Date(ms)
  const y = d.getUTCFullYear()
  const mo = d.getUTCMonth() + 1
  const da = d.getUTCDate()
  return `${y}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}`
}

/**
 * Project a recurring date (birthday / hire date) into every occurrence year
 * intersecting the [fromMs, toMs] window. Feb 29 falls back to Feb 28 in
 * non-leap years so the event still surfaces.
 */
function projectAnnualOccurrences(
  base: Ymd,
  fromMs: number,
  toMs: number
): Array<{ dateMs: number; year: number }> {
  const fromYear = new Date(fromMs).getUTCFullYear()
  const toYear = new Date(toMs).getUTCFullYear()
  const out: Array<{ dateMs: number; year: number }> = []
  for (let year = fromYear; year <= toYear; year++) {
    const monthIndex = base.m - 1
    let occMs = Date.UTC(year, monthIndex, base.d)
    if (new Date(occMs).getUTCMonth() !== monthIndex) {
      occMs = Date.UTC(year, monthIndex, base.d - 1)
    }
    if (occMs >= fromMs && occMs <= toMs) {
      out.push({ dateMs: occMs, year })
    }
  }
  return out
}

function pushEndDateEvent(
  events: HrCalendarEvent[],
  e: Employee,
  type: 'contract_end' | 'probation_end',
  endYmd: string,
  fromMs: number,
  toMs: number
) {
  const ms = ymdToUtcMs(endYmd)
  if (ms === null || ms < fromMs || ms > toMs) return
  events.push({
    id: `${e.employeeKey}__${type}__${endYmd}`,
    type,
    date: endYmd,
    employeeKey: e.employeeKey,
    employeeName: e.name,
    countryAssigned: e.countryAssigned,
    department: e.department,
    position: e.position
  })
}

/**
 * Build calendar events for the given window. Reuses the same active-employee
 * and contract-style filters as the contracts page, so events stay in sync
 * with the contract / probation tables.
 */
export function deriveCalendarEvents(
  employees: readonly Employee[],
  range: { fromYmd: string; toYmd: string }
): HrCalendarEvent[] {
  const fromMs = ymdToUtcMs(range.fromYmd)
  const toMs = ymdToUtcMs(range.toYmd)
  if (fromMs === null || toMs === null || fromMs > toMs) return []

  const events: HrCalendarEvent[] = []
  for (const e of employees) {
    if (!isActiveEmployeeStatus(e.employeeStatus)) continue

    const birthBase = parseYmd(e.birthDate)
    if (birthBase) {
      for (const occ of projectAnnualOccurrences(birthBase, fromMs, toMs)) {
        const date = utcMsToYmd(occ.dateMs)
        events.push({
          id: `${e.employeeKey}__birthday__${date}`,
          type: 'birthday',
          date,
          employeeKey: e.employeeKey,
          employeeName: e.name,
          countryAssigned: e.countryAssigned,
          department: e.department,
          position: e.position,
          age: occ.year - birthBase.y
        })
      }
    }

    const startBase = parseYmd(e.startDate)
    if (startBase) {
      for (const occ of projectAnnualOccurrences(startBase, fromMs, toMs)) {
        const years = occ.year - startBase.y
        if (years < 1) continue
        const date = utcMsToYmd(occ.dateMs)
        events.push({
          id: `${e.employeeKey}__anniversary__${date}`,
          type: 'anniversary',
          date,
          employeeKey: e.employeeKey,
          employeeName: e.name,
          countryAssigned: e.countryAssigned,
          department: e.department,
          position: e.position,
          yearsOfService: years
        })
      }
    }

    if (e.contractEndDate && isContractStyleEmployee(e.employeeType)) {
      pushEndDateEvent(events, e, 'contract_end', e.contractEndDate, fromMs, toMs)
    }

    if (e.probationEndDate) {
      pushEndDateEvent(events, e, 'probation_end', e.probationEndDate, fromMs, toMs)
    }
  }

  events.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.employeeName.localeCompare(b.employeeName) ||
      a.type.localeCompare(b.type) ||
      a.employeeKey.localeCompare(b.employeeKey)
  )
  return events
}
