import { createError, getQuery } from 'h3'
import { prisma } from '../utils/db'

const ALLOWED_ENTITY_TYPES = new Set(['CriticalRecruitment', 'Vacancy'])

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const entityType = typeof q.entityType === 'string' ? q.entityType.trim() : ''
  const entityId = typeof q.entityId === 'string' ? q.entityId.trim() : ''

  if (!entityType || !entityId) {
    throw createError({ statusCode: 400, statusMessage: 'entityType and entityId are required' })
  }
  if (!ALLOWED_ENTITY_TYPES.has(entityType)) {
    throw createError({ statusCode: 400, statusMessage: `Unknown entityType: ${entityType}` })
  }

  const events = await prisma.auditEvent.findMany({
    where: { entityType, entityId },
    orderBy: { occurredAt: 'desc' }
  })

  return events.map((e) => ({
    id: e.id,
    action: e.action,
    actorName: e.actorName,
    actorEmail: e.actorEmail,
    occurredAt: e.occurredAt.toISOString(),
    diff: e.diff ?? null
  }))
})
