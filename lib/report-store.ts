import 'server-only'
import type { Category, Report, TimelineEvent } from './reports'

type StoredReport = Omit<Report, 'confirmedByMe' | 'isMine' | 'confirmations'> & {
  reporterId: string
  confirmers: string[]
}

// In-memory store: swap for a database table (reports + confirmations) once one is connected.
const store = globalThis as unknown as {
  __matReports?: Map<string, StoredReport>
  __matSeeded?: Set<string>
  __matSeq?: number
}
store.__matReports ??= new Map()
store.__matSeeded ??= new Set()
store.__matSeq ??= 1040

const reports = store.__matReports
const seeded = store.__matSeeded

function nextRef(code: string) {
  store.__matSeq = (store.__matSeq ?? 1040) + 1
  return `MAT-${code}-${String(store.__matSeq).padStart(6, '0')}`
}

function ago(days: number, hours = 0) {
  return new Date(Date.now() - (days * 24 + hours) * 3_600_000).toISOString()
}

function seed(code: string) {
  if (seeded.has(code)) return
  seeded.add(code)
  const samples: {
    category: Category
    title: string
    location: string
    ward: string
    days: number
    confirmers: number
    ref?: string
    description: string
  }[] = [
    {
      category: 'pothole',
      title: 'Deep pothole in left lane',
      location: 'Main Rd near the taxi rank',
      ward: '57',
      days: 41,
      confirmers: 23,
      ref: '9123345671',
      description: 'Roughly 60cm wide. Cars swerve into oncoming lane after dark.',
    },
    {
      category: 'streetlight',
      title: 'Four streetlights out in a row',
      location: 'Church St, between 3rd & 5th Ave',
      ward: '57',
      days: 12,
      confirmers: 9,
      description: 'Whole block dark since the storm. Pedestrian route to the station.',
    },
    {
      category: 'water',
      title: 'Burst pipe running for days',
      location: 'Corner of Oak & Vlei Rd',
      ward: '58',
      days: 5,
      confirmers: 14,
      ref: '9123390012',
      description: 'Clean water flowing into the stormwater drain continuously.',
    },
  ]

  for (const s of samples) {
    const id = crypto.randomUUID()
    const createdAt = ago(s.days, 3)
    const timeline: TimelineEvent[] = [{ at: createdAt, type: 'logged', note: 'Logged by resident' }]
    if (s.ref) {
      timeline.push({
        at: ago(s.days - 1),
        type: 'municipal_ref',
        note: `Resident added municipal reference ${s.ref}`,
      })
    }
    timeline.push({ at: ago(Math.max(0, s.days - 2)), type: 'confirmed', note: `${s.confirmers} neighbours confirmed` })
    reports.set(id, {
      id,
      ref: nextRef(code),
      municipality: code,
      category: s.category,
      title: s.title,
      description: s.description,
      location: s.location,
      ward: s.ward,
      createdAt,
      municipalRef: s.ref,
      reporterId: 'sample',
      confirmers: Array.from({ length: s.confirmers }, (_, i) => `sample-${i}`),
      timeline,
      sample: true,
    })
  }
}

function present(r: StoredReport, visitorId: string): Report {
  const { reporterId, confirmers, ...rest } = r
  return {
    ...rest,
    confirmations: confirmers.length,
    confirmedByMe: confirmers.includes(visitorId),
    isMine: reporterId === visitorId,
  }
}

export function listReports(code: string, visitorId: string) {
  seed(code)
  return [...reports.values()]
    .filter((r) => r.municipality === code)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((r) => present(r, visitorId))
}

export function getReport(id: string, visitorId: string) {
  const r = reports.get(id)
  return r ? present(r, visitorId) : null
}

export type NewReport = {
  municipality: string
  category: Category
  title: string
  description: string
  location: string
  ward?: string
  lat?: number
  lng?: number
}

export function createReport(input: NewReport, visitorId: string) {
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  const stored: StoredReport = {
    ...input,
    id,
    ref: nextRef(input.municipality),
    createdAt,
    reporterId: visitorId,
    confirmers: [],
    timeline: [{ at: createdAt, type: 'logged', note: 'Logged by you' }],
  }
  reports.set(id, stored)
  return present(stored, visitorId)
}

export type ReportAction =
  | { action: 'confirm' }
  | { action: 'municipal_ref'; value: string }
  | { action: 'remind'; days: number }
  | { action: 'resolved' }

export function applyAction(id: string, visitorId: string, payload: ReportAction) {
  const r = reports.get(id)
  if (!r) return null
  const now = new Date().toISOString()

  switch (payload.action) {
    case 'confirm':
      if (r.reporterId !== visitorId && !r.confirmers.includes(visitorId)) {
        r.confirmers.push(visitorId)
        r.timeline.push({ at: now, type: 'confirmed', note: 'A neighbour confirmed this issue' })
      }
      break
    case 'municipal_ref':
      r.municipalRef = payload.value
      r.timeline.push({ at: now, type: 'municipal_ref', note: `Resident added municipal reference ${payload.value}` })
      break
    case 'remind': {
      r.reminderAt = new Date(Date.now() + payload.days * 86_400_000).toISOString()
      r.timeline.push({ at: now, type: 'reminder_set', note: `Follow-up reminder set for ${payload.days} days` })
      break
    }
    case 'resolved':
      if (!r.residentResolvedAt) {
        r.residentResolvedAt = now
        r.timeline.push({ at: now, type: 'resident_resolved', note: 'Resident reports this is fixed' })
      }
      break
  }
  return present(r, visitorId)
}
