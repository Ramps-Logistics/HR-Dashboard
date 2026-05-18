import { createError, getRouterParam } from 'h3'
import { prisma } from '../../../utils/db'
import { getOdooEmployeeByKey } from '../../../utils/odooEmployees'

export default defineEventHandler(async (event) => {
  const employeeKey = getRouterParam(event, 'employeeKey')
  if (!employeeKey) {
    throw createError({ statusCode: 400, statusMessage: 'employeeKey is required' })
  }

  const employee = await getOdooEmployeeByKey(employeeKey)
  if (!employee) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }

  const rows = await prisma.employeePersonalNote.findMany({
    where: { employeeKey },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      content: true,
      authorEmail: true,
      authorName: true,
      createdAt: true,
      updatedAt: true
    }
  })

  return {
    notes: rows.map((r) => ({
      id: r.id,
      content: r.content,
      authorEmail: r.authorEmail,
      authorName: r.authorName,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString()
    }))
  }
})
