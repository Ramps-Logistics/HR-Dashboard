import { randomUUID } from 'node:crypto'
import { createError, readBody } from 'h3'
import { prisma } from '../utils/db'
import { BRANCH_COMPANIES, type BranchCompany } from '../utils/branchClassification'

type DisciplinaryCase = {
  id: string
  employeeName: string
  department: string
  country: string
  company: BranchCompany
  summary: string
  status: string
  includeInReport: boolean
  createdAt: string
}

function requireNonEmptyString(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw createError({ statusCode: 400, statusMessage: `${field} is required` })
  }
  return value.trim()
}

function optionalString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function optionalBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : null
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
  const department = optionalString(body?.department)
  const country = requireNonEmptyString(body?.country, 'country')
  const company = requireCompany(body?.company)
  const summary = requireNonEmptyString(body?.summary, 'summary')
  const status = requireNonEmptyString(body?.status, 'status')
  const includeInReport = optionalBoolean(body?.includeInReport) ?? false

  const createdAt = new Date()
  const created = await prisma.disciplinaryCase.create({
    data: {
      id: randomUUID(),
      employeeName,
      department,
      country,
      company,
      summary,
      status,
      includeInReport,
      createdAt
    }
  })

  return { ...created, createdAt: createdAt.toISOString() }
})

