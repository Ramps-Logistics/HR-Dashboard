import { createError, getRouterParam } from 'h3'
import { prisma } from '../../utils/db'
import { getCurrentUser, logAuditEvent } from '../../utils/audit'

type CriticalRecruitment = {
  id: string
  candidateName: string
  position: string
  country: string
  stage: string
  createdAt: string
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })
  const actor = await getCurrentUser(event)

  await prisma.$transaction(async (tx) => {
    const existing = await tx.criticalRecruitment.findUnique({ where: { id } })
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'Critical recruitment item not found' })

    await tx.criticalRecruitment.delete({ where: { id } })
    await logAuditEvent(tx, {
      entityType: 'CriticalRecruitment',
      entityId: id,
      action: 'delete',
      actor
    })
  })

  return { ok: true }
})

