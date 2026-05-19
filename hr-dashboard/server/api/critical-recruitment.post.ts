import { randomUUID } from 'node:crypto'
import { createError, readBody } from 'h3'
import { prisma } from '../utils/db'
import { getCurrentUser, logAuditEvent } from '../utils/audit'
import { BRANCH_COMPANIES, type BranchCompany } from '../utils/branchClassification'

type CriticalRecruitment = {
  id: string
  candidateName: string
  position: string
  country: string
  company: BranchCompany
  stage: string
  notes?: string
  createdAt: string
}

function requireNonEmptyString(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw createError({ statusCode: 400, statusMessage: `${field} is required` })
  }
  return value.trim()
}

function optionalTrimmedString(value: unknown) {
  if (value == null) return undefined
  if (typeof value !== 'string') return undefined
  const s = value.trim()
  return s ? s : undefined
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
  const candidateName = requireNonEmptyString(body?.candidateName, 'candidateName')
  const position = requireNonEmptyString(body?.position, 'position')
  const country = requireNonEmptyString(body?.country, 'country')
  const company = requireCompany(body?.company)
  const stage = requireNonEmptyString(body?.stage, 'stage')
  const notes = optionalTrimmedString(body?.notes)
  const actor = await getCurrentUser(event)

  const id = randomUUID()
  const createdAt = new Date()
  const created = await prisma.$transaction(async (tx) => {
    const row = await tx.criticalRecruitment.create({
      data: { id, candidateName, position, country, company, stage, notes, createdAt }
    })
    await logAuditEvent(tx, {
      entityType: 'CriticalRecruitment',
      entityId: id,
      action: 'create',
      actor
    })
    return row
  })

  return { ...created, createdAt: createdAt.toISOString() }
})

