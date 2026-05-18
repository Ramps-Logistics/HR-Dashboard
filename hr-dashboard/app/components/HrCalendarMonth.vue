<template>
  <section class="space-y-4">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
          aria-label="Previous month"
          @click="shiftMonth(-1)"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true">
            <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 0 1 0 1.06L9.06 10l3.73 3.71a.75.75 0 1 1-1.06 1.06l-4.24-4.24a.75.75 0 0 1 0-1.06l4.24-4.24a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd" />
          </svg>
        </button>
        <h2 class="min-w-[12rem] text-base font-semibold text-hr-navy">{{ monthLabel }}</h2>
        <button
          type="button"
          class="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
          aria-label="Next month"
          @click="shiftMonth(1)"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true">
            <path fill-rule="evenodd" d="M7.21 5.23a.75.75 0 0 1 1.06 0l4.24 4.24a.75.75 0 0 1 0 1.06l-4.24 4.24a.75.75 0 1 1-1.06-1.06L10.94 10 7.21 6.29a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
          </svg>
        </button>
        <button
          type="button"
          class="ml-1 inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
          @click="goToToday"
        >
          Today
        </button>
      </div>

    </header>

    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <div class="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        <div v-for="day in WEEKDAY_LABELS" :key="day" class="px-2 py-2 text-center">
          {{ day }}
        </div>
      </div>
      <div class="grid grid-cols-7">
        <button
          v-for="cell in cells"
          :key="cell.dateYmd"
          type="button"
          data-hr-calendar-cell
          class="relative flex min-h-[6.5rem] flex-col gap-1 overflow-hidden border-b border-r border-slate-200 px-2 py-2 text-left text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-blue/40"
          :class="cellClass(cell)"
          :aria-pressed="cell.dateYmd === selectedCell?.ymd"
          @click="onCellClick($event, cell)"
        >
          <span class="flex items-center">
            <span
              class="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-1 font-semibold tabular-nums"
              :class="dayBadgeClass(cell)"
            >
              {{ cell.dayOfMonth }}
            </span>
          </span>
          <span v-if="cell.events.length > 0" class="flex min-w-0 flex-col gap-0.5">
            <span
              v-for="badge in cellBadges(cell)"
              :key="badge.type"
              class="inline-flex max-w-full items-center gap-1 truncate rounded-full border px-1.5 py-0.5 text-[10px] font-medium leading-tight"
              :class="eventTypeStyle(badge.type).badge"
              :title="badge.title"
            >
              <span class="truncate">{{ eventTypeLabel(badge.type) }}</span>
              <span v-if="badge.count > 1" class="shrink-0 tabular-nums opacity-80">&times;{{ badge.count }}</span>
            </span>
          </span>
        </button>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="selectedCell"
        ref="popoverEl"
        role="dialog"
        aria-label="Day events"
        class="fixed z-[300] flex w-[22.5rem] max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/15"
        :style="{ left: `${popoverPos.left}px`, top: `${popoverPos.top}px`, maxHeight: `${popoverPos.maxHeight}px` }"
        @click.stop
      >
        <header class="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div class="min-w-0">
            <p class="text-[11px] font-medium uppercase tracking-wide text-slate-400">{{ selectedDayWeekday }}</p>
            <h3 class="truncate text-sm font-semibold text-hr-navy">{{ selectedDayLabel }}</h3>
          </div>
          <button
            type="button"
            class="-mr-1 -mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
            aria-label="Close"
            @click="closePopover"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M4.21 4.21a.75.75 0 0 1 1.06 0L10 8.94l4.73-4.73a.75.75 0 1 1 1.06 1.06L11.06 10l4.73 4.73a.75.75 0 1 1-1.06 1.06L10 11.06l-4.73 4.73a.75.75 0 1 1-1.06-1.06L8.94 10 4.21 5.27a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </button>
        </header>
        <ul class="min-h-0 flex-1 divide-y divide-slate-200 overflow-y-auto px-4 py-1">
          <li v-for="event in selectedDayEvents" :key="event.id" class="flex min-w-0 items-start gap-3 py-3">
            <span class="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full" :class="eventTypeStyle(event.type).dot" aria-hidden="true" />
            <div class="min-w-0 flex-1">
              <NuxtLink
                :to="`/odoo/employees/${event.employeeKey}`"
                class="block truncate text-sm font-medium text-hr-navy hover:text-brand-blue"
                :title="eventTitle(event)"
                @click="closePopover"
              >
                {{ eventTitle(event) }}
              </NuxtLink>
              <div class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                <span class="inline-flex items-center rounded-full border px-2 py-0.5 font-medium" :class="eventTypeStyle(event.type).badge">
                  {{ eventTypeLabel(event.type) }}
                </span>
                <span v-if="event.position" class="truncate">{{ event.position }}</span>
                <span v-if="event.countryAssigned" class="truncate">{{ event.countryAssigned }}</span>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { formatYmdDate } from '~/utils/dates'
import {
  HR_CALENDAR_EVENT_TYPES,
  eventTitle,
  eventTypeLabel,
  eventTypeStyle,
  utcTodayMs,
  type HrCalendarEvent,
  type HrCalendarEventType
} from '~/utils/hrCalendar'

const props = defineProps<{
  events: HrCalendarEvent[]
}>()

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function todayParts() {
  const today = new Date(utcTodayMs())
  return { y: today.getUTCFullYear(), m: today.getUTCMonth() }
}

const initialToday = todayParts()
const cursorYear = ref(initialToday.y)
const cursorMonth = ref(initialToday.m)

function ymd(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const monthLabel = computed(() => {
  return new Date(Date.UTC(cursorYear.value, cursorMonth.value, 1)).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  })
})

function shiftMonth(delta: number) {
  const next = new Date(Date.UTC(cursorYear.value, cursorMonth.value + delta, 1))
  cursorYear.value = next.getUTCFullYear()
  cursorMonth.value = next.getUTCMonth()
  closePopover()
}

function goToToday() {
  const t = todayParts()
  cursorYear.value = t.y
  cursorMonth.value = t.m
  closePopover()
}

const eventsByDate = computed(() => {
  const map = new Map<string, HrCalendarEvent[]>()
  for (const e of props.events) {
    const list = map.get(e.date)
    if (list) list.push(e)
    else map.set(e.date, [e])
  }
  return map
})

type Cell = {
  dateYmd: string
  dayOfMonth: number
  isCurrentMonth: boolean
  isToday: boolean
  events: HrCalendarEvent[]
}

const cells = computed<Cell[]>(() => {
  const firstOfMonth = Date.UTC(cursorYear.value, cursorMonth.value, 1)
  const firstWeekday = new Date(firstOfMonth).getUTCDay()
  const gridStart = new Date(firstOfMonth)
  gridStart.setUTCDate(gridStart.getUTCDate() - firstWeekday)

  const todayMs = utcTodayMs()
  const result: Cell[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setUTCDate(d.getUTCDate() + i)
    const y = d.getUTCFullYear()
    const m = d.getUTCMonth()
    const day = d.getUTCDate()
    const dateYmd = ymd(y, m, day)
    result.push({
      dateYmd,
      dayOfMonth: day,
      isCurrentMonth: m === cursorMonth.value,
      isToday: d.getTime() === todayMs,
      events: eventsByDate.value.get(dateYmd) ?? []
    })
  }
  return result
})

const selectedCell = ref<{ ymd: string } | null>(null)
const popoverEl = ref<HTMLElement | null>(null)
const popoverPos = ref({ left: 0, top: 0, maxHeight: 480 })

const POPOVER_WIDTH = 360
const POPOVER_MIN_VISIBLE_HEIGHT = 320
const POPOVER_GAP = 8

const selectedDayEvents = computed<HrCalendarEvent[]>(() => {
  if (!selectedCell.value) return []
  return eventsByDate.value.get(selectedCell.value.ymd) ?? []
})

const selectedDayLabel = computed(() => (selectedCell.value ? formatYmdDate(selectedCell.value.ymd) : ''))

const SELECTED_DAY_WEEKDAY_FMT = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' })

const selectedDayWeekday = computed(() => {
  const ms = selectedCell.value ? ymdToUtcMsLocal(selectedCell.value.ymd) : null
  return ms === null ? '' : SELECTED_DAY_WEEKDAY_FMT.format(new Date(ms))
})

function ymdToUtcMsLocal(s: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

function cellClass(cell: Cell): string {
  const isSelected = cell.dateYmd === selectedCell.value?.ymd
  const muted = cell.isCurrentMonth ? 'text-slate-800' : 'text-slate-400'
  const bg = isSelected
    ? 'bg-brand-blue/5'
    : cell.isCurrentMonth
      ? 'bg-white hover:bg-slate-50'
      : 'bg-slate-50/50 hover:bg-slate-100/60'
  return `${muted} ${bg}`
}

function dayBadgeClass(cell: Cell): string {
  const isSelected = cell.dateYmd === selectedCell.value?.ymd
  if (cell.isToday) return 'bg-brand-blue text-white'
  if (isSelected) return 'bg-brand-blue/10 text-brand-blue'
  return cell.isCurrentMonth ? 'text-slate-700' : 'text-slate-400'
}

function cellBadges(cell: Cell): Array<{ type: HrCalendarEventType; count: number; title: string }> {
  const counts = new Map<HrCalendarEventType, number>()
  for (const e of cell.events) counts.set(e.type, (counts.get(e.type) ?? 0) + 1)
  const out: Array<{ type: HrCalendarEventType; count: number; title: string }> = []
  for (const type of HR_CALENDAR_EVENT_TYPES) {
    const count = counts.get(type) ?? 0
    if (count === 0) continue
    const label = eventTypeLabel(type)
    out.push({ type, count, title: count > 1 ? `${label} \u00d7 ${count}` : label })
  }
  return out
}

function onCellClick(event: MouseEvent, cell: Cell) {
  if (cell.events.length === 0) {
    closePopover()
    return
  }
  selectedCell.value = { ymd: cell.dateYmd }
  const target = event.currentTarget as HTMLElement | null
  if (!target) return
  positionPopover(target.getBoundingClientRect())
}

function positionPopover(anchor: DOMRect) {
  if (typeof window === 'undefined') return
  const vpW = window.innerWidth
  const vpH = window.innerHeight

  let left = anchor.right + POPOVER_GAP
  if (left + POPOVER_WIDTH > vpW - POPOVER_GAP) {
    const leftCandidate = anchor.left - POPOVER_WIDTH - POPOVER_GAP
    left = leftCandidate >= POPOVER_GAP
      ? leftCandidate
      : Math.max(POPOVER_GAP, vpW - POPOVER_WIDTH - POPOVER_GAP)
  }

  // Align top with the anchor cell, but ensure the popover always has at
  // least MIN_VISIBLE_HEIGHT of room beneath `top`. If not (cell near the
  // bottom of the viewport), slide `top` up so the popover stays fully
  // inside the viewport. `maxHeight` matches the remaining space so the
  // inner list scrolls instead of clipping.
  const minVisibleHeight = Math.min(POPOVER_MIN_VISIBLE_HEIGHT, vpH - 2 * POPOVER_GAP)
  let top = Math.max(POPOVER_GAP, anchor.top)
  if (vpH - top - POPOVER_GAP < minVisibleHeight) {
    top = Math.max(POPOVER_GAP, vpH - POPOVER_GAP - minVisibleHeight)
  }
  const maxHeight = vpH - top - POPOVER_GAP

  popoverPos.value = { left, top, maxHeight }
}

function closePopover() {
  selectedCell.value = null
}

function onDocumentPointerDown(event: PointerEvent | MouseEvent) {
  if (!selectedCell.value) return
  const target = event.target as Node | null
  if (!target) return
  if (popoverEl.value && popoverEl.value.contains(target)) return
  const cellTarget = (event.target as HTMLElement | null)?.closest?.('[data-hr-calendar-cell]')
  if (cellTarget) return
  closePopover()
}

function onWindowScroll(event: Event) {
  if (!selectedCell.value) return
  // Scrolling inside the popover's own list should not close it. Capture-phase
  // scroll catches element-level scrolls too, so check the target.
  const target = event.target as Node | null
  if (target && popoverEl.value && popoverEl.value.contains(target)) return
  closePopover()
}

function onWindowResize() {
  if (selectedCell.value) closePopover()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && selectedCell.value) closePopover()
}

onMounted(() => {
  if (typeof document === 'undefined') return
  document.addEventListener('pointerdown', onDocumentPointerDown, true)
  window.addEventListener('scroll', onWindowScroll, true)
  window.addEventListener('resize', onWindowResize)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  if (typeof document === 'undefined') return
  document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  window.removeEventListener('scroll', onWindowScroll, true)
  window.removeEventListener('resize', onWindowResize)
  document.removeEventListener('keydown', onKeydown)
})
</script>
