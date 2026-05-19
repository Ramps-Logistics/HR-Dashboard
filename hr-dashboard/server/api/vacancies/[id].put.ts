import { createError, getRouterParam, readBody } from 'h3'
import { prisma } from '../../utils/db'
import { computeDiff, getCurrentUser, logAuditEvent } from '../../utils/audit'
import { BRANCH_COMPANIES, type BranchCompany } from '../../utils/branchClassification'

type Vacancy = {
  id: string
  positionTitle: string
  department: string
  country: string
  company: BranchCompany
  priority: string
  notes: string
  createdAt: string
}

const AUDITED_FIELDS = ['positionTitle', 'department', 'country', 'company', 'priority', 'notes'] as const

function requireNonEmptyString(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw createError({ statusCode: 400, statusMessage: `${field} is required` })
  }
  return value.trim()
}

function requireCompany(value: unknown): BranchCompany {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw) throw createError({ statusCode: 400, statusMessage: 'company is required' })
  if (!(BRANCH_COMPANIES as readonly string[]).includes(raw)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid company: ${raw}` })
  }
  return raw as BranchCompany
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const body = (await readBody(event)) as Record<string, unknown> | null
  const positionTitle = requireNonEmptyString(body?.positionTitle, 'positionTitle')
  const department = requireNonEmptyString(body?.department, 'department')
  const country = requireNonEmptyString(body?.country, 'country')
  const company = requireCompany(body?.company)
  const priority = requireNonEmptyString(body?.priority, 'priority')
  const notes = typeof body?.notes === 'string' ? body.notes.trim() : ''
  const actor = await getCurrentUser(event)

  const updated = await prisma.$transaction(async (tx) => {
    const existing = await tx.vacancy.findUnique({ where: { id } })
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'Vacancy not found' })

    const row = await tx.vacancy.update({
      where: { id },
      data: { positionTitle, department, country, company, priority, notes }
    })

    const diff = computeDiff(
      { positionTitle: existing.positionTitle, department: existing.department, country: existing.country, company: existing.company, priority: existing.priority, notes: existing.notes },
      { positionTitle: row.positionTitle, department: row.department, country: row.country, company: row.company, priority: row.priority, notes: row.notes },
      AUDITED_FIELDS
    )

    if (diff) {
      await logAuditEvent(tx, {
        entityType: 'Vacancy',
        entityId: id,
        action: 'update',
        actor,
        diff
      })
    }

    return row
  })

  return { ...updated, createdAt: updated.createdAt.toISOString() }
})

