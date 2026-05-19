export const BRANCH_COUNTRIES = [
  'Trinidad and Tobago',
  'Guyana',
  'USA',
  'Suriname',
  'Mexico',
  'Colombia'
] as const

export type BranchCountry = (typeof BRANCH_COUNTRIES)[number]

export const BRANCH_COMPANIES = ['Ramps Logistics', 'EDO'] as const
export type BranchCompany = (typeof BRANCH_COMPANIES)[number]

function norm(input: unknown) {
  const s = String(input ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\u2010-\u2015]/g, '-') // normalize dash variants
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
  return s
}

function hasAny(haystack: string, needles: string[]) {
  for (const n of needles) {
    if (!n) continue
    if (haystack.includes(n)) return true
  }
  return false
}

function hasToken(haystack: string, token: string) {
  const t = token.trim()
  if (!t) return false
  if (t.includes(' ')) return haystack.includes(t)
  return new RegExp(`(?:^|\\s)${t}(?:\\s|$)`, 'i').test(haystack)
}

export type BranchAssignment = { country: BranchCountry; company: BranchCompany }

export function classifyBranchAssignment(input: {
  companyName?: string | null
  workAddress?: string | null
  fallbackCountry?: string | null
}): BranchAssignment {
  const company = norm(input.companyName)
  const addr = norm(input.workAddress)
  const fallback = norm(input.fallbackCountry)
  const all = `${company} ${addr} ${fallback}`.trim()

  // El Dorado Offshore → company = EDO, country derived from regional hints.
  if (hasAny(all, ['el dorado offshore', 'eldorado offshore', 'el dorado'])) {
    if (hasAny(all, ['guyana', 'georgetown', 'demerara']) || hasToken(all, 'gy')) {
      return { country: 'Guyana', company: 'EDO' }
    }
    if (
      hasAny(all, ['trinidad', 'tobago', 'cunupia', 'port of spain', 'chaguanas']) ||
      hasToken(all, 'tt')
    ) {
      return { country: 'Trinidad and Tobago', company: 'EDO' }
    }
    // Fallback: EDO with unknown region defaults to TT (HQ).
    return { country: 'Trinidad and Tobago', company: 'EDO' }
  }

  // Ramps Logistics LLC (Houston / USA)
  if (
    hasAny(all, ['houston', 'texas', 'united states', 'usa']) ||
    hasToken(all, 'tx') ||
    hasToken(all, 'llc') ||
    hasAny(all, ['ramps logistics llc']) ||
    company.includes('houston')
  ) {
    return { country: 'USA', company: 'Ramps Logistics' }
  }

  // Specific country branches (Ramps Logistics)
  if (hasAny(all, ['suriname', 'paramaribo'])) return { country: 'Suriname', company: 'Ramps Logistics' }
  if (hasAny(all, ['mexico', 'méxico', 'cdmx', 'mexico city'])) return { country: 'Mexico', company: 'Ramps Logistics' }
  if (hasAny(all, ['colombia', 'columbia', 'bogota', 'barranquilla', 'medellin'])) return { country: 'Colombia', company: 'Ramps Logistics' }
  if (hasAny(all, ['guyana', 'georgetown'])) return { country: 'Guyana', company: 'Ramps Logistics' }
  if (hasAny(all, ['trinidad', 'tobago', 'cunupia', 'port of spain'])) return { country: 'Trinidad and Tobago', company: 'Ramps Logistics' }

  // Company-name fallbacks (when address isn't available)
  if (hasAny(company, ['guyana'])) return { country: 'Guyana', company: 'Ramps Logistics' }
  if (hasAny(company, ['suriname'])) return { country: 'Suriname', company: 'Ramps Logistics' }
  if (hasAny(company, ['mexico'])) return { country: 'Mexico', company: 'Ramps Logistics' }
  if (hasAny(company, ['colombia', 'columbia'])) return { country: 'Colombia', company: 'Ramps Logistics' }
  if (hasAny(company, ['limited', 'ltd'])) return { country: 'Trinidad and Tobago', company: 'Ramps Logistics' }

  // Last-resort mapping from Odoo-provided country value.
  if (hasAny(fallback, ['guyana'])) return { country: 'Guyana', company: 'Ramps Logistics' }
  if (hasAny(fallback, ['suriname'])) return { country: 'Suriname', company: 'Ramps Logistics' }
  if (hasAny(fallback, ['mexico'])) return { country: 'Mexico', company: 'Ramps Logistics' }
  if (hasAny(fallback, ['colombia', 'columbia'])) return { country: 'Colombia', company: 'Ramps Logistics' }
  if (hasAny(fallback, ['trinidad', 'tobago', 'tt'])) return { country: 'Trinidad and Tobago', company: 'Ramps Logistics' }

  // Default fallback.
  return { country: 'Trinidad and Tobago', company: 'Ramps Logistics' }
}

/** @deprecated Use classifyBranchAssignment() — kept for backward compatibility. */
export function classifyBranchCountry(input: {
  companyName?: string | null
  workAddress?: string | null
  fallbackCountry?: string | null
}): BranchCountry {
  return classifyBranchAssignment(input).country
}

export function sortBranchCountries(values: string[]): BranchCountry[] {
  const present = new Set(values.map((v) => String(v ?? '').trim()).filter(Boolean))
  return BRANCH_COUNTRIES.filter((c) => present.has(c))
}

/** Coerce a legacy stored country (possibly "El Dorado Offshore TT/GY") into the new 6-bucket value. */
export function normalizeStoredCountry(value: string | null | undefined): BranchCountry | null {
  const v = (value ?? '').trim()
  if (!v) return null
  if (v === 'El Dorado Offshore TT') return 'Trinidad and Tobago'
  if (v === 'El Dorado Offshore GY') return 'Guyana'
  if ((BRANCH_COUNTRIES as readonly string[]).includes(v)) return v as BranchCountry
  return null
}

/** Coerce a legacy stored country into its implied company (EDO if it was an "El Dorado Offshore *" value). */
export function inferLegacyCompany(value: string | null | undefined): BranchCompany {
  const v = (value ?? '').trim()
  if (v === 'El Dorado Offshore TT' || v === 'El Dorado Offshore GY') return 'EDO'
  return 'Ramps Logistics'
}
