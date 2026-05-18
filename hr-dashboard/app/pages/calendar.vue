<template>
  <div class="min-w-0 space-y-6">
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0 space-y-1">
        <h1 class="text-gradient-brand text-3xl font-extrabold tracking-tight">HR Calendar</h1>
        <p class="text-slate-600">Birthdays, work anniversaries, contract and probation milestones.</p>
      </div>
      <button
        v-if="!pending && !error"
        type="button"
        class="relative inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-hr-navy shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
        :aria-label="alertsButtonLabel"
        :title="alertsButtonLabel"
        :aria-expanded="alertsOpen"
        @click="alertsOpen = true"
      >
        <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-pink-50 text-pink-700">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-4 w-4"
            :class="{ 'hr-bell-ring': todayAlertCount > 0 }"
            aria-hidden="true"
          >
            <path d="M6 8a6 6 0 0 1 12 0v3.5l1.5 3a.75.75 0 0 1-.67 1.1H5.17a.75.75 0 0 1-.67-1.1L6 11.5V8Z" />
            <path d="M9.5 18a2.5 2.5 0 0 0 5 0" />
          </svg>
        </span>
        <span>Alerts</span>
        <span
          v-if="todayAlertCount > 0"
          class="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-pink-600 px-1.5 text-[11px] font-semibold tabular-nums text-white"
          aria-hidden="true"
        >
          {{ todayAlertCount > 99 ? '99+' : todayAlertCount }}
        </span>
      </button>
    </header>

    <div v-if="pending" class="rounded-md border border-slate-200 bg-white shadow-card p-4 text-slate-800">Loading…</div>
    <div v-else-if="error" class="rounded-md border border-pink-200 bg-pink-50 p-4 text-pink-800">
      Failed to load HR calendar.
      <div v-if="errorMessage" class="mt-2 text-xs text-pink-700/80">{{ errorMessage }}</div>
    </div>

    <template v-else>
      <EventTypeFilter
        v-model="selectedTypes"
        :counts="typeCounts"
        :total-count="events.length"
      />
      <HrCalendarMonth :events="filteredEvents" />
      <HrAlertsDrawer v-model:open="alertsOpen" :events="filteredEvents" />
    </template>
  </div>
</template>

<script setup lang="ts">
import EventTypeFilter from '~/components/EventTypeFilter.vue'
import HrAlertsDrawer from '~/components/HrAlertsDrawer.vue'
import HrCalendarMonth from '~/components/HrCalendarMonth.vue'
import {
  countEventsByType,
  filterEventsByType,
  groupAlertsForDrawer,
  utcTodayMs,
  type HrCalendarEventType
} from '~/utils/hrCalendar'

const { data, pending, error } = useHrCalendarEvents()

const events = computed(() => data.value?.events ?? [])

const selectedTypes = ref<HrCalendarEventType[]>([])
const alertsOpen = ref(false)

const typeCounts = computed(() => countEventsByType(events.value))

const filteredEvents = computed(() =>
  filterEventsByType(events.value, new Set(selectedTypes.value))
)

const todayAlertCount = computed(
  () => groupAlertsForDrawer(filteredEvents.value, utcTodayMs()).today.length
)

const alertsButtonLabel = computed(() => {
  const n = todayAlertCount.value
  if (n === 0) return 'Open alerts'
  return `Open alerts — ${n} today`
})

const errorMessage = computed(() => {
  const e = error.value as unknown as Record<string, unknown> | null | undefined
  if (!e) return ''
  const d = e['data'] as Record<string, unknown> | undefined
  const dataMessage = typeof d?.message === 'string' ? d.message : ''
  const errMessage = typeof e['message'] === 'string' ? (e['message'] as string) : ''
  const statusMessage = typeof e['statusMessage'] === 'string' ? (e['statusMessage'] as string) : ''
  return dataMessage || errMessage || statusMessage || ''
})
</script>
