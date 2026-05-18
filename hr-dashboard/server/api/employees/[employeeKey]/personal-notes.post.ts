import { randomUUID } from 'node:crypto'
import { createError, getRouterParam, readBody, useSession } from 'h3'
import { prisma } from '../../../utils/db'
import { getAuthSessionConfig } from '../../../utils/authSession'
import { getOdooEmployeeByKey } from '../../../utils/odooEmployees'

const MAX_CONTENT_LENGTH = 4000

export default defineEventHandler(async (event) => {
  const employeeKey = getRouterParam(event, 'employeeKey')
  if (!employeeKey) {
    throw createError({ statusCode: 400, statusMessage: 'employeeKey is required' })
  }

  const employee = await getOdooEmployeeByKey(employeeKey)
  if (!employee) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }

  const body = (await readBody(event)) as Record<string, unknown> | null
  const rawContent = typeof body?.content === 'string' ? body.content : ''
  const content = rawContent.trim()
  if (!content) {
    throw createError({ statusCode: 400, statusMessage: 'content is required' })
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    throw createError({ statusCode: 400, statusMessage: `content must be ${MAX_CONTENT_LENGTH} characters or fewer` })
  }

  const session = await useSession(event, getAuthSessionConfig(event))
  const user = session.data.user
  const authorEmail = (user?.email ?? '').trim()
  const authorName = (user?.name ?? '').trim()

  const created = await prisma.employeePersonalNote.create({
    data: {
      id: randomUUID(),
      employeeKey,
      content,
      authorEmail,
      authorName
    }
  })

  return {
    note: {
      id: created.id,
      content: created.content,
      authorEmail: created.authorEmail,
      authorName: created.authorName,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString()
    }
  }
})
