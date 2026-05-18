export type WorkforceBucket = 'permanent' | 'contracted' | 'intern'

export function classifyWorkforceBucket(raw: string | undefined): WorkforceBucket {
  const v = (raw ?? '').trim().toLowerCase()
  if (!v) return 'permanent'
  if (v.includes('intern')) return 'intern'
  if (v.includes('contract') || v.includes('fixed') || v.includes('temp') || v.includes('casual')) return 'contracted'
  if (v.includes('permanent') || v.includes('perm')) return 'permanent'
  return 'permanent'
}

export function isContractStyleEmployee(raw: string | undefined): boolean {
  const b = classifyWorkforceBucket(raw)
  return b === 'contracted' || b === 'intern'
}

export function isActiveEmployeeStatus(status: string | undefined): boolean {
  return (status ?? '').trim().toLowerCase() === 'active'
}
