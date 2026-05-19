import type { H3Event } from 'h3'
import { useSession } from 'h3'
import { randomUUID } from 'node:crypto'
import type { Prisma, PrismaClient } from '../../prisma/generated/client'
import { getAuthSessionConfig } from './authSession'

export type AuditActor = {
  sub: string
  name: string
  email: string
}

export type AuditAction = 'create' | 'update' | 'delete' | 'shortlist' | 'unshortlist'

export type PrismaTx = PrismaClient | Prisma.TransactionClient

export async function getCurrentUser(event: H3Event): Promise<AuditActor> {
  const session = await useSession(event, getAuthSessionConfig(event))
  const user = session.data.user
  return {
    sub: (user?.sub ?? '').trim(),
    name: (user?.name ?? '').trim(),
    email: (user?.email ?? '').trim()
  }
}

export async function logAuditEvent(
  tx: PrismaTx,
  params: {
    entityType: string
    entityId: string
    action: AuditAction
    actor: AuditActor
    diff?: Record<string, { from: unknown; to: unknown }>
  }
) {
  await tx.auditEvent.create({
    data: {
      id: randomUUID(),
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      actorSub: params.actor.sub,
      actorName: params.actor.name,
      actorEmail: params.actor.email,
      diff: params.diff ? (params.diff as Prisma.InputJsonValue) : undefined
    }
  })
}

export function computeDiff<T extends Record<string, unknown>>(
  before: T,
  after: T,
  fields: ReadonlyArray<keyof T>
): Record<string, { from: unknown; to: unknown }> | undefined {
  const diff: Record<string, { from: unknown; to: unknown }> = {}
  for (const field of fields) {
    const from = before[field] ?? null
    const to = after[field] ?? null
    if (from !== to) {
      diff[field as string] = { from, to }
    }
  }
  return Object.keys(diff).length > 0 ? diff : undefined
}
