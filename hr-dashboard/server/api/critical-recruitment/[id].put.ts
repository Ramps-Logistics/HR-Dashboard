import { createError, getRouterParam, readBody } from 'h3'
import { prisma } from '../../utils/db'
import { computeDiff, getCurrentUser, logAuditEvent } from '../../utils/audit'
import { BRANCH_COMPANIES, type BranchCompany } from '../../utils/branchClassification'

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

const AUDITED_FIELDS = ['candidateName', 'position', 'country', 'company', 'stage', 'notes'] as const

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
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const body = (await readBody(event)) as Record<string, unknown> | null
  const candidateName = requireNonEmptyString(body?.candidateName, 'candidateName')
  const position = requireNonEmptyString(body?.position, 'position')
  const country = requireNonEmptyString(body?.country, 'country')
  const company = requireCompany(body?.company)
  const stage = requireNonEmptyString(body?.stage, 'stage')
  const notes = optionalTrimmedString(body?.notes)
  const actor = await getCurrentUser(event)

  const updated = await prisma.$transaction(async (tx) => {
    const existing = await tx.criticalRecruitment.findUnique({ where: { id } })
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'Critical recruitment item not found' })

    const row = await tx.criticalRecruitment.update({
      where: { id },
      data: { candidateName, position, country, company, stage, notes }
    })

    const diff = computeDiff(
      { candidateName: existing.candidateName, position: existing.position, country: existing.country, company: existing.company, stage: existing.stage, notes: existing.notes ?? null },
      { candidateName: row.candidateName, position: row.position, country: row.country, company: row.company, stage: row.stage, notes: row.notes ?? null },
      AUDITED_FIELDS
    )

    if (diff) {
      await logAuditEvent(tx, {
        entityType: 'CriticalRecruitment',
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

