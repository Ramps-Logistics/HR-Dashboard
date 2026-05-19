import { createError, getRouterParam, readBody } from 'h3'
import { prisma } from '../../utils/db'
import { BRANCH_COMPANIES, type BranchCompany } from '../../utils/branchClassification'

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

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const body = (await readBody(event)) as Record<string, unknown> | null
  const employeeNameRaw = body?.employeeName
  const departmentRaw = body?.department
  const countryRaw = body?.country
  const companyRaw = body?.company
  const summaryRaw = body?.summary
  const statusRaw = body?.status
  const includeInReportRaw = body?.includeInReport

  const existing = await prisma.disciplinaryCase.findUnique({ where: { id } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Disciplinary case not found' })

  const employeeName = employeeNameRaw === undefined ? existing.employeeName : requireNonEmptyString(employeeNameRaw, 'employeeName')
  const department = departmentRaw === undefined ? existing.department : optionalString(departmentRaw)
  const country = countryRaw === undefined ? existing.country : requireNonEmptyString(countryRaw, 'country')
  const summary = summaryRaw === undefined ? existing.summary : requireNonEmptyString(summaryRaw, 'summary')
  const status = statusRaw === undefined ? existing.status : requireNonEmptyString(statusRaw, 'status')
  const includeInReport = includeInReportRaw === undefined ? existing.includeInReport : (optionalBoolean(includeInReportRaw) ?? existing.includeInReport)

  let company: BranchCompany = (existing.company as BranchCompany) ?? 'Ramps Logistics'
  if (companyRaw !== undefined) {
    const raw = typeof companyRaw === 'string' ? companyRaw.trim() : ''
    if (!raw) throw createError({ statusCode: 400, statusMessage: 'company is required' })
    if (!(BRANCH_COMPANIES as readonly string[]).includes(raw)) {
      throw createError({ statusCode: 400, statusMessage: `Invalid company: ${raw}` })
    }
    company = raw as BranchCompany
  }

  const updated = await prisma.disciplinaryCase.update({
    where: { id },
    data: { employeeName, department, country, company, summary, status, includeInReport }
  })

  return { ...updated, createdAt: updated.createdAt.toISOString() }
})

