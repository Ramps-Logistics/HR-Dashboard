<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

type AuditEvent = {
  id: string
  action: 'create' | 'update' | 'delete' | 'shortlist' | 'unshortlist' | string
  actorName: string
  actorEmail: string
  occurredAt: string
  diff: Record<string, { from: unknown; to: unknown }> | null
}

const props = withDefaults(
  defineProps<{
    entityType: string
    entityId: string
    placement?: 'bottom-right' | 'top-right'
    size?: 'sm' | 'md'
  }>(),
  { placement: 'bottom-right', size: 'md' }
)

const popoverPositionClass = computed(() =>
  props.placement === 'top-right'
    ? 'right-0 bottom-[calc(100%+0.5rem)]'
    : 'right-0 top-[calc(100%+0.5rem)]'
)

const triggerSizeClass = computed(() => (props.size === 'sm' ? 'h-6 w-6' : 'h-8 w-8'))
const iconSizeClass = computed(() => (props.size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'))

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const events = ref<AuditEvent[]>([])
const pending = ref(false)
const error = ref('')
const fetched = ref(false)
const showFullHistory = ref(false)

const createEvent = computed(() => events.value.find((e) => e.action === 'create') ?? null)
const lastModifyEvent = computed(() => events.value.find((e) => e.action === 'update') ?? null)

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return iso
  }
}

function displayActor(e: AuditEvent) {
  return e.actorName || e.actorEmail || 'Unknown'
}

function actionLabel(action: string) {
  if (action === 'create') return 'Created'
  if (action === 'update') return 'Updated'
  if (action === 'delete') return 'Deleted'
  if (action === 'shortlist') return 'Shortlisted'
  if (action === 'unshortlist') return 'Restored to pipeline'
  return action
}

async function loadEvents() {
  pending.value = true
  error.value = ''
  try {
    const data = await $fetch<AuditEvent[]>('/api/audit-events', {
      query: { entityType: props.entityType, entityId: props.entityId }
    })
    events.value = data
    fetched.value = true
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load audit trail'
    error.value = message
  } finally {
    pending.value = false
  }
}

function toggle() {
  open.value = !open.value
}

watch(open, (isOpen) => {
  if (isOpen && !fetched.value) {
    void loadEvents()
  }
  if (!isOpen) {
    showFullHistory.value = false
  }
})

function handleDocumentClick(event: MouseEvent) {
  if (!open.value) return
  const el = root.value
  if (el && !el.contains(event.target as Node)) {
    open.value = false
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div ref="root" class="group relative inline-block">
    <button
      type="button"
      class="inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
      :class="triggerSizeClass"
      :aria-expanded="open"
      aria-label="View audit history"
      @click.stop="toggle"
    >
      <svg
        :class="iconSizeClass"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    </button>

    <span
      v-if="!open"
      class="pointer-events-none absolute -top-8 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
    >
      View audit history
    </span>

    <div
      v-if="open"
      role="dialog"
      class="absolute z-50 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-lg ring-1 ring-black/5"
      :class="popoverPositionClass"
      @click.stop
    >
      <div class="border-b border-slate-100 px-4 py-2.5">
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Audit trail</div>
      </div>

      <div class="px-4 py-3 text-sm text-slate-800">
        <div v-if="pending" class="text-slate-500">Loading…</div>
        <div v-else-if="error" class="text-pink-700">{{ error }}</div>
        <div v-else-if="events.length === 0" class="text-slate-500">No audit history yet.</div>

        <div v-else>
          <div v-if="!showFullHistory" class="space-y-3">
            <div v-if="createEvent">
              <div class="text-xs text-slate-500">Created by</div>
              <div class="font-medium text-slate-900">{{ displayActor(createEvent) }}</div>
              <div class="text-xs text-slate-500">{{ formatDate(createEvent.occurredAt) }}</div>
            </div>
            <div v-if="lastModifyEvent">
              <div class="text-xs text-slate-500">Last modified by</div>
              <div class="font-medium text-slate-900">{{ displayActor(lastModifyEvent) }}</div>
              <div class="text-xs text-slate-500">{{ formatDate(lastModifyEvent.occurredAt) }}</div>
            </div>
            <div v-if="!createEvent && !lastModifyEvent" class="text-slate-500">
              {{ actionLabel(events[0].action) }} by {{ displayActor(events[0]) }} on {{ formatDate(events[0].occurredAt) }}
            </div>
          </div>

          <ul v-else class="max-h-72 space-y-3 overflow-y-auto pr-1">
            <li v-for="e in events" :key="e.id" class="text-xs">
              <div class="font-medium text-slate-900">
                {{ actionLabel(e.action) }} by {{ displayActor(e) }}
              </div>
              <div class="text-slate-500">{{ formatDate(e.occurredAt) }}</div>
              <ul v-if="e.diff" class="mt-1 space-y-0.5 text-slate-600">
                <li v-for="(change, field) in e.diff" :key="field">
                  <span class="font-medium">{{ field }}:</span>
                  <span class="text-slate-500"> {{ change.from ?? '—' }} → </span>
                  <span>{{ change.to ?? '—' }}</span>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>

      <div v-if="events.length > 1" class="border-t border-slate-100 px-4 py-2 text-right">
        <button
          type="button"
          class="text-xs font-medium text-brand-purple hover:underline"
          @click="showFullHistory = !showFullHistory"
        >
          {{ showFullHistory ? 'Show summary' : 'View full history' }}
        </button>
      </div>
    </div>
  </div>
</template>
