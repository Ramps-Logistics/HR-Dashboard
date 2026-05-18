import type { HrCalendarEvent } from '~/utils/hrCalendar'

export type HrCalendarPayload = {
  from: string
  to: string
  events: HrCalendarEvent[]
}

/**
 * Single shared fetch for HR calendar events. Uses a stable key so the alerts
 * button in the header and the calendar page reuse the same dataset.
 */
export function useHrCalendarEvents() {
  return useFetch<HrCalendarPayload>('/api/odoo/calendar', {
    key: 'hr-calendar-events',
    default: () => ({ from: '', to: '', events: [] })
  })
}
