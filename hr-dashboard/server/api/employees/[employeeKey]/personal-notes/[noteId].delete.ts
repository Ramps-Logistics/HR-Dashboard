import { createError, getRouterParam } from 'h3'
import { prisma } from '../../../../utils/db'

export default defineEventHandler(async (event) => {
  const employeeKey = getRouterParam(event, 'employeeKey')
  const noteId = getRouterParam(event, 'noteId')
  if (!employeeKey) throw createError({ statusCode: 400, statusMessage: 'employeeKey is required' })
  if (!noteId) throw createError({ statusCode: 400, statusMessage: 'noteId is required' })

  const existing = await prisma.employeePersonalNote.findUnique({ where: { id: noteId } })
  if (!existing || existing.employeeKey !== employeeKey) {
    throw createError({ statusCode: 404, statusMessage: 'Note not found' })
  }

  await prisma.employeePersonalNote.delete({ where: { id: noteId } })
  return { ok: true }
})
