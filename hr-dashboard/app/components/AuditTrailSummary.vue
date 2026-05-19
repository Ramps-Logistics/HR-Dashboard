<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

type AuditEvent = {
  id: string
  action: 'create' | 'update' | 'delete' | 'shortlist' | 'unshortlist' | string
  actorName: string
  actorEmail: string
  occurredAt: string
  diff: Record<string, { from: unknown; to: unknown }> | null
}

const props = defineProps<{
  entityType: string
  entityId: string
}>()

const events = ref<AuditEvent[]>([])
const pending = ref(false)
const error = ref('')
const showFullHistory = ref(false)

const createEvent = computed(() => events.value.find((e) => e.action === 'create') ?? null)
const lastModifyEvent = computed(() => events.value.find((e) => e.action === 'update') ?? null)
const shortlistEvent = computed(() => events.value.find((e) => e.action === 'shortlist') ?? null)

async function loadEvents() {
  pending.value = true
  error.value = ''
  try {
    const data = await $fetch<AuditEvent[]>('/api/audit-events', {
      query: { entityType: props.entityType, entityId: props.entityId }
    })
    events.value = data
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load audit trail'
  } finally {
    pending.value = false
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

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})

function formatDate(iso: string) {
  try {
    return dateFormatter.format(new Date(iso))
  } catch {
    return iso
  }
}

onMounted(() => {
  void loadEvents()
})

watch(
  () => [props.entityType, props.entityId],
  () => {
    showFullHistory.value = false
    void loadEvents()
  }
)
</script>

<template>
  <div class="text-left">
    <div v-if="pending" class="text-xs text-slate-400">Loading…</div>
    <div v-else-if="error" class="text-xs text-pink-700">{{ error }}</div>
    <div v-else-if="events.length === 0" class="text-xs text-slate-500">No audit history yet.</div>
    <div v-else>
      <dl v-if="!showFullHistory" class="space-y-2 border-l-2 border-slate-100 pl-2">
        <div v-if="createEvent">
          <dt class="text-[10px] uppercase tracking-wide text-slate-400">Created by</dt>
          <dd class="text-xs text-slate-700">
            <div class="break-words">{{ displayActor(createEvent) }}</div>
            <div class="text-slate-500 tabular-nums">{{ formatDate(createEvent.occurredAt) }}</div>
          </dd>
        </div>
        <div v-if="lastModifyEvent">
          <dt class="text-[10px] uppercase tracking-wide text-slate-400">Last modified by</dt>
          <dd class="text-xs text-slate-700">
            <div class="break-words">{{ displayActor(lastModifyEvent) }}</div>
            <div class="text-slate-500 tabular-nums">{{ formatDate(lastModifyEvent.occurredAt) }}</div>
          </dd>
        </div>
        <div v-if="shortlistEvent">
          <dt class="text-[10px] uppercase tracking-wide text-slate-400">Shortlisted by</dt>
          <dd class="text-xs text-slate-700">
            <div class="break-words">{{ displayActor(shortlistEvent) }}</div>
            <div class="text-slate-500 tabular-nums">{{ formatDate(shortlistEvent.occurredAt) }}</div>
          </dd>
        </div>
      </dl>

      <ul v-else class="max-h-72 space-y-3 overflow-y-auto border-l-2 border-slate-100 pl-2 pr-1">
        <li v-for="e in events" :key="e.id" class="text-xs">
          <div class="font-medium text-slate-900">
            {{ actionLabel(e.action) }} by {{ displayActor(e) }}
          </div>
          <div class="text-slate-500 tabular-nums">{{ formatDate(e.occurredAt) }}</div>
          <ul v-if="e.diff" class="mt-1 space-y-0.5 text-slate-600">
            <li v-for="(change, field) in e.diff" :key="field">
              <span class="font-medium">{{ field }}:</span>
              <span class="text-slate-500"> {{ change.from ?? '—' }} → </span>
              <span>{{ change.to ?? '—' }}</span>
            </li>
          </ul>
        </li>
      </ul>

      <div v-if="events.length > 1" class="mt-2">
        <button
          type="button"
          class="text-xs font-medium text-hr-navy hover:underline"
          @click="showFullHistory = !showFullHistory"
        >
          {{ showFullHistory ? 'Show summary' : 'View full history' }}
        </button>
      </div>
    </div>
  </div>
</template>
