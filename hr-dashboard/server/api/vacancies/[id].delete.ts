import { createError, getRouterParam } from 'h3'
import { prisma } from '../../utils/db'
import { getCurrentUser, logAuditEvent } from '../../utils/audit'

type Vacancy = {
  id: string
  positionTitle: string
  department: string
  country: string
  priority: string
  createdAt: string
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })
  const actor = await getCurrentUser(event)

  await prisma.$transaction(async (tx) => {
    const existing = await tx.vacancy.findUnique({ where: { id } })
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'Vacancy not found' })

    await tx.vacancy.delete({ where: { id } })
    await logAuditEvent(tx, {
      entityType: 'Vacancy',
      entityId: id,
      action: 'delete',
      actor
    })
  })

  return { ok: true }
})

