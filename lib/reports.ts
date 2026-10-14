export const CATEGORIES = ['pothole', 'streetlight', 'water', 'sewage', 'refuse', 'other'] as const
export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_LABEL: Record<Category, string> = {
  pothole: 'Pothole',
  streetlight: 'Streetlight out',
  water: 'Water leak / outage',
  sewage: 'Sewage spill',
  refuse: 'Missed refuse',
  other: 'Other',
}

export type TimelineEvent = {
  at: string
  type: 'logged' | 'confirmed' | 'municipal_ref' | 'reminder_set' | 'resident_resolved'
  note: string
}

export type Report = {
  id: string
  ref: string
  municipality: string
  category: Category
  title: string
  description: string
  location: string
  ward?: string
  lat?: number
  lng?: number
  createdAt: string
  confirmations: number
  confirmedByMe: boolean
  isMine: boolean
  municipalRef?: string
  residentResolvedAt?: string
  reminderAt?: string
  timeline: TimelineEvent[]
  sample?: boolean
}

export function daysOpen(report: Pick<Report, 'createdAt' | 'residentResolvedAt'>) {
  const end = report.residentResolvedAt ? new Date(report.residentResolvedAt) : new Date()
  return Math.max(0, Math.floor((end.getTime() - new Date(report.createdAt).getTime()) / 86_400_000))
}

export function formatStamp(iso: string) {
  return new Intl.DateTimeFormat('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Africa/Johannesburg',
  }).format(new Date(iso))
}

export function formatRand(value: number) {
  const abs = Math.abs(value)
  const sign = value < 0 ? '−' : ''
  if (abs >= 1e9) return `${sign}R${(abs / 1e9).toFixed(1)}bn`
  if (abs >= 1e6) return `${sign}R${(abs / 1e6).toFixed(0)}m`
  if (abs >= 1e3) return `${sign}R${(abs / 1e3).toFixed(0)}k`
  return `${sign}R${abs.toFixed(0)}`
}
