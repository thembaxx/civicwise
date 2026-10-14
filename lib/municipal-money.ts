import 'server-only'

const BASE = 'https://municipaldata.treasury.gov.za/api/cubes'
const DAY = 60 * 60 * 24

export type Municipality = {
  code: string
  name: string
  province: string
  category: string
}

export type MunicipalityProfile = Municipality & {
  longName: string
  phone?: string
  url?: string
}

export const SPENDING_ITEMS: Record<string, string> = {
  '3100': 'Employee costs',
  '3300': 'Bulk electricity',
  '3800': 'Contracted services',
  '3600': 'Depreciation',
  '3500': 'Debt impairment',
  '3400': 'Inventory consumed',
  '3900': 'Transfers & subsidies',
  '3700': 'Interest',
  '4100': 'Other operational',
}

const REVENUE = '2900'
const EXPENDITURE = '4400'

export type FinanceYear = {
  year: number
  revenue?: number
  expenditure?: number
  budgetedExpenditure?: number
  breakdown: { code: string; label: string; amount: number }[]
}

export type AuditOpinion = { year: number; label: string; code: string }

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, { next: { revalidate: DAY } })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function getMunicipalities(): Promise<Municipality[]> {
  const fields = [
    'municipality.demarcation_code',
    'municipality.name',
    'municipality.province_code',
    'municipality.category',
  ].join(',')
  const json = await getJson<{ data: Record<string, string>[] }>(
    `/municipalities/facts?fields=${fields}&pagesize=400`,
  )
  if (!json) return []
  return json.data
    .filter((m) => m['municipality.category'] !== 'C')
    .map((m) => ({
      code: m['municipality.demarcation_code'],
      name: m['municipality.name'],
      province: m['municipality.province_code'],
      category: m['municipality.category'],
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getMunicipalityProfile(code: string): Promise<MunicipalityProfile | null> {
  const cut = encodeURIComponent(`municipality.demarcation_code:"${code}"`)
  const json = await getJson<{ data: Record<string, string>[] }>(`/municipalities/facts?cut=${cut}`)
  const m = json?.data[0]
  if (!m) return null
  return {
    code,
    name: m['municipality.name'],
    longName: m['municipality.long_name'],
    province: m['municipality.province_name'],
    category: m['municipality.category'],
    phone: m['municipality.phone_number']?.trim() || undefined,
    url: m['municipality.url']?.trim() || undefined,
  }
}

export async function getFinances(code: string): Promise<FinanceYear[]> {
  const items = [REVENUE, EXPENDITURE, ...Object.keys(SPENDING_ITEMS)].map((c) => `"${c}"`).join(';')
  const cut = encodeURIComponent(
    `demarcation.code:"${code}"|amount_type.code:"AUDA";"ORGB"|period_length.length:"year"|item.code:${items}`,
  )
  const drilldown = encodeURIComponent('financial_year_end.year|item.code|amount_type.code')
  const json = await getJson<{ cells: Record<string, string | number>[] }>(
    `/incexp_v2/aggregate?aggregates=amount.sum&cut=${cut}&drilldown=${drilldown}`,
  )
  if (!json) return []

  const years = new Map<number, FinanceYear>()
  for (const cell of json.cells) {
    const year = Number(cell['financial_year_end.year'])
    const item = String(cell['item.code'])
    const type = String(cell['amount_type.code'])
    const amount = Number(cell['amount.sum'])
    if (!years.has(year)) years.set(year, { year, breakdown: [] })
    const fy = years.get(year)!
    if (type === 'ORGB') {
      if (item === EXPENDITURE) fy.budgetedExpenditure = amount
      continue
    }
    if (item === REVENUE) fy.revenue = amount
    else if (item === EXPENDITURE) fy.expenditure = amount
    else if (SPENDING_ITEMS[item] && amount > 0) {
      fy.breakdown.push({ code: item, label: SPENDING_ITEMS[item], amount })
    }
  }

  return [...years.values()]
    .filter((y) => y.revenue !== undefined || y.expenditure !== undefined)
    .map((y) => ({ ...y, breakdown: y.breakdown.sort((a, b) => b.amount - a.amount) }))
    .sort((a, b) => a.year - b.year)
}

export async function getAuditOpinions(code: string): Promise<AuditOpinion[]> {
  const cut = encodeURIComponent(`demarcation.code:"${code}"`)
  const json = await getJson<{ data: Record<string, string | number>[] }>(
    `/audit_opinions/facts?cut=${cut}&fields=financial_year_end.year,opinion.label,opinion.code`,
  )
  if (!json) return []
  return json.data
    .map((d) => ({
      year: Number(d['financial_year_end.year']),
      label: String(d['opinion.label']),
      code: String(d['opinion.code']),
    }))
    .sort((a, b) => a.year - b.year)
}
