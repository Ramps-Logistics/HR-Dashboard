import { randomUUID } from 'node:crypto'
import { createError, readBody } from 'h3'
import { prisma } from '../utils/db'
import { BRANCH_COMPANIES, type BranchCompany } from '../utils/branchClassification'

type MedicalEnrollment = {
  id: string
  employeeName: string
  country: string
  company: BranchCompany
  enrollmentType?: string
  vendor?: string
  stage: string
  dateInitiated?: string
  nextAction?: string
  hrRepresentative?: string
  notes?: string
  attachmentsUrl?: string
  createdAt: string
  updatedAt: string
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
  const employeeName = requireNonEmptyString(body?.employeeName, 'employeeName')
  const country = requireNonEmptyString(body?.country, 'country')
  const company = requireCompany(body?.company)
  const stage = requireNonEmptyString(body?.stage, 'stage')

  const enrollmentType = optionalTrimmedString(body?.enrollmentType)
  const vendor = optionalTrimmedString(body?.vendor)
  const dateInitiated = optionalTrimmedString(body?.dateInitiated)
  const nextAction = optionalTrimmedString(body?.nextAction)
  const hrRepresentative = optionalTrimmedString(body?.hrRepresentative)
  const notes = optionalTrimmedString(body?.notes)
  const attachmentsUrl = optionalTrimmedString(body?.attachmentsUrl)

  const now = new Date()
  const created = await prisma.medicalEnrollment.create({
    data: {
      id: randomUUID(),
      employeeName,
      country,
      company,
      enrollmentType,
      vendor,
      stage,
      dateInitiated,
      nextAction,
      hrRepresentative,
      notes,
      attachmentsUrl,
      createdAt: now,
      updatedAt: now
    }
  })

  return { ...created, createdAt: created.createdAt.toISOString(), updatedAt: created.updatedAt.toISOString() }
})

