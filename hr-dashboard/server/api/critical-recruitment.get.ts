import { prisma } from '../utils/db'

type CriticalRecruitment = {
  id: string
  candidateName: string
  position: string
  country: string
  company: string
  stage: string
  notes?: string
  createdAt: string
  shortlistedAt: string | null
}

export default defineEventHandler(async () => {
  const items = await prisma.criticalRecruitment.findMany({ orderBy: { createdAt: 'desc' } })
  return items.map((v) => ({
    ...v,
    createdAt: v.createdAt.toISOString(),
    shortlistedAt: v.shortlistedAt ? v.shortlistedAt.toISOString() : null
  }))
})

