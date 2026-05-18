<template>
  <div class="flex flex-wrap items-center gap-2" role="group" aria-label="Event type filters">
    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
      :class="allActive ? 'border-brand-blue/30 bg-brand-blue/10 text-brand-blue' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'"
      :aria-pressed="allActive"
      @click="onAllClick"
    >
      <span>All</span>
      <span class="tabular-nums opacity-80">{{ totalCount }}</span>
    </button>
    <button
      v-for="type in HR_CALENDAR_EVENT_TYPES"
      :key="type"
      type="button"
      class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40"
      :class="chipClass(type)"
      :aria-pressed="isActive(type)"
      @click="toggle(type)"
    >
      <span class="inline-block h-2 w-2 rounded-full" :class="eventTypeStyle(type).dot" aria-hidden="true" />
      <span>{{ eventTypeLabel(type) }}</span>
      <span class="tabular-nums opacity-80">{{ counts[type] }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import {
  HR_CALENDAR_EVENT_TYPES,
  eventTypeLabel,
  eventTypeStyle,
  type EventTypeCounts,
  type HrCalendarEventType
} from '~/utils/hrCalendar'

const props = defineProps<{
  modelValue: HrCalendarEventType[]
  counts: EventTypeCounts
  totalCount: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: HrCalendarEventType[]): void
}>()

const allActive = computed(() => props.modelValue.length === 0)

function isActive(type: HrCalendarEventType): boolean {
  return props.modelValue.includes(type)
}

function chipClass(type: HrCalendarEventType): string {
  if (isActive(type)) return `border ${eventTypeStyle(type).badge}`
  return 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
}

function onAllClick() {
  if (props.modelValue.length === 0) return
  emit('update:modelValue', [])
}

function toggle(type: HrCalendarEventType) {
  const set = new Set(props.modelValue)
  if (set.has(type)) set.delete(type)
  else set.add(type)
  emit('update:modelValue', Array.from(set))
}
</script>
