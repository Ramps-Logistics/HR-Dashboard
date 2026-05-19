import { createError, getRouterParam, readBody } from 'h3'
import { prisma } from '../../../utils/db'
import { getCurrentUser, logAuditEvent } from '../../../utils/audit'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const body = (await readBody(event)) as Record<string, unknown> | null
  if (typeof body?.shortlisted !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'shortlisted boolean is required' })
  }
  const shortlisted = body.shortlisted
  const actor = await getCurrentUser(event)

  const updated = await prisma.$transaction(async (tx) => {
    const existing = await tx.criticalRecruitment.findUnique({ where: { id } })
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'Critical recruitment item not found' })

    const wasShortlisted = existing.shortlistedAt !== null
    if (wasShortlisted === shortlisted) {
      return existing
    }

    const row = await tx.criticalRecruitment.update({
      where: { id },
      data: { shortlistedAt: shortlisted ? new Date() : null }
    })

    await logAuditEvent(tx, {
      entityType: 'CriticalRecruitment',
      entityId: id,
      action: shortlisted ? 'shortlist' : 'unshortlist',
      actor
    })

    return row
  })

  return {
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    shortlistedAt: updated.shortlistedAt ? updated.shortlistedAt.toISOString() : null
  }
})
