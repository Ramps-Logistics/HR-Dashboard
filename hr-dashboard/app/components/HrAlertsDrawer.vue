<template>
  <Teleport to="body">
    <Transition name="hr-drawer-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[400]"
        aria-hidden="true"
        @click="onBackdropClick"
      >
        <div class="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px]" />
      </div>
    </Transition>

    <Transition name="hr-drawer-slide">
      <aside
        v-if="open"
        ref="panelEl"
        role="dialog"
        aria-modal="true"
        aria-label="HR alerts"
        class="fixed inset-y-0 right-0 z-[401] flex w-[24rem] max-w-[92vw] flex-col bg-white shadow-2xl shadow-slate-900/20"
        tabindex="-1"
      >
        <header class="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div class="min-w-0 space-y-0.5">
            <div class="flex items-center gap-2">
              <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-pink-200 bg-pink-50 text-pink-700" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="h-4 w-4"
                  :class="{ 'hr-bell-ring': todayCount > 0 }"
                >
                  <path d="M6 8a6 6 0 0 1 12 0v3.5l1.5 3a.75.75 0 0 1-.67 1.1H5.17a.75.75 0 0 1-.67-1.1L6 11.5V8Z" />
                  <path d="M9.5 18a2.5 2.5 0 0 0 5 0" />
                </svg>
              </span>
              <h2 class="text-gradient-brand text-lg font-bold tracking-tight">Alerts</h2>
            </div>
            <p class="text-xs text-slate-500">This week and next week.</p>
          </div>
          <button
            type="button"
            class="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
            aria-label="Close alerts"
            @click="$emit('update:open', false)"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M4.21 4.21a.75.75 0 0 1 1.06 0L10 8.94l4.73-4.73a.75.75 0 1 1 1.06 1.06L11.06 10l4.73 4.73a.75.75 0 1 1-1.06 1.06L10 11.06l-4.73 4.73a.75.75 0 1 1-1.06-1.06L8.94 10 4.21 5.27a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </button>
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <p v-if="totalCount === 0" class="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
            No alerts for the next 7 days.
          </p>

          <ol v-else class="space-y-5">
            <li v-for="section in visibleSections" :key="section" class="space-y-2">
              <header class="flex items-center justify-between gap-2">
                <h3 class="text-sm font-semibold text-hr-navy">{{ alertSectionLabel(section) }}</h3>
                <span
                  class="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full border px-2 text-xs font-semibold tabular-nums"
                  :class="sectionBadgeClass(section)"
                >
                  {{ grouped[section].length }}
                </span>
              </header>
              <ul class="space-y-2">
                <li
                  v-for="event in grouped[section]"
                  :key="event.id"
                  class="flex min-w-0 items-start gap-2 rounded-md border border-slate-200 bg-white px-3 py-2"
                  :class="section === 'today' ? 'border-pink-200 bg-pink-50/40' : ''"
                >
                  <span class="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full" :class="eventTypeStyle(event.type).dot" aria-hidden="true" />
                  <div class="min-w-0 flex-1">
                    <NuxtLink
                      :to="`/odoo/employees/${event.employeeKey}`"
                      class="block truncate text-sm font-semibold text-hr-navy hover:text-brand-blue"
                      :title="eventTitle(event)"
                      @click="$emit('update:open', false)"
                    >
                      {{ eventTitle(event) }}
                    </NuxtLink>
                    <div class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                      <span class="inline-flex items-center rounded-full border px-2 py-0.5 font-medium" :class="eventTypeStyle(event.type).badge">
                        {{ eventTypeLabel(event.type) }}
                      </span>
                      <span v-if="section === 'this_week' || section === 'next_week'" class="tabular-nums">{{ shortDateLabel(event.date) }}</span>
                      <span v-if="event.position" class="truncate">{{ event.position }}</span>
                      <span v-if="event.countryAssigned" class="truncate">{{ event.countryAssigned }}</span>
                    </div>
                  </div>
                </li>
              </ul>
            </li>
          </ol>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import {
  ALERT_SECTION_ORDER,
  alertSectionLabel,
  eventTitle,
  eventTypeLabel,
  eventTypeStyle,
  groupAlertsForDrawer,
  shortDateLabel,
  utcTodayMs,
  type AlertSection,
  type HrCalendarEvent
} from '~/utils/hrCalendar'

const props = defineProps<{
  open: boolean
  events: HrCalendarEvent[]
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const panelEl = ref<HTMLElement | null>(null)

const grouped = computed(() => groupAlertsForDrawer(props.events, utcTodayMs()))

const todayCount = computed(() => grouped.value.today.length)

const totalCount = computed(() =>
  ALERT_SECTION_ORDER.reduce((acc, s) => acc + grouped.value[s].length, 0)
)

const visibleSections = computed<AlertSection[]>(() =>
  ALERT_SECTION_ORDER.filter((s) => grouped.value[s].length > 0)
)

function sectionBadgeClass(section: AlertSection): string {
  if (section === 'today') return 'border-pink-200 bg-pink-50 text-pink-800'
  if (section === 'tomorrow') return 'border-amber-200 bg-amber-50 text-amber-800'
  if (section === 'this_week') return 'border-blue-200 bg-blue-50 text-blue-900'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function onBackdropClick() {
  emit('update:open', false)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) emit('update:open', false)
}

watch(
  () => props.open,
  (next) => {
    if (next) {
      nextTick(() => panelEl.value?.focus())
    }
  }
)

onMounted(() => {
  if (typeof document === 'undefined') return
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  if (typeof document === 'undefined') return
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.hr-drawer-fade-enter-active,
.hr-drawer-fade-leave-active {
  transition: opacity 200ms ease;
}
.hr-drawer-fade-enter-from,
.hr-drawer-fade-leave-to {
  opacity: 0;
}

.hr-drawer-slide-enter-active,
.hr-drawer-slide-leave-active {
  transition: transform 240ms cubic-bezier(0.32, 0.72, 0, 1);
}
.hr-drawer-slide-enter-from,
.hr-drawer-slide-leave-to {
  transform: translateX(100%);
}
</style>
