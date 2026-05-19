import { randomUUID } from 'node:crypto'
import { createError, readBody } from 'h3'
import { prisma } from '../utils/db'
import { getCurrentUser, logAuditEvent } from '../utils/audit'
import { BRANCH_COMPANIES, type BranchCompany } from '../utils/branchClassification'

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
  const body = (await readBody(event)) as Record<string, unknown> | null
  const positionTitle = requireNonEmptyString(body?.positionTitle, 'positionTitle')
  const department = requireNonEmptyString(body?.department, 'department')
  const country = requireNonEmptyString(body?.country, 'country')
  const company = requireCompany(body?.company)
  const priority = requireNonEmptyString(body?.priority, 'priority')
  const notes = typeof body?.notes === 'string' ? body.notes.trim() : ''
  const actor = await getCurrentUser(event)

  const id = randomUUID()
  const createdAt = new Date()
  const created = await prisma.$transaction(async (tx) => {
    const row = await tx.vacancy.create({
      data: { id, positionTitle, department, country, company, priority, notes, createdAt }
    })
    await logAuditEvent(tx, {
      entityType: 'Vacancy',
      entityId: id,
      action: 'create',
      actor
    })
    return row
  })

  return { ...created, createdAt: createdAt.toISOString() }
})

