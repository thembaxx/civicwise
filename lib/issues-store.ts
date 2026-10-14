import 'server-only'
import type {
  Category,
  EventType,
  Issue,
  IssueAction,
  IssueEvent,
} from './issues'

/**
 * In-memory store for the prototype. Swap for a database table
 * (issues + issue_events) before launch — the shapes map 1:1.
 */
type StoredIssue = Omit<Issue, 'confirmations' | 'confirmedByMe' | 'isMine'> & {
  ownerId: string
  confirmers: string[]
}

const SEED_OWNER = 'seed-community'

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 3_600_000).toISOString()
}

function seedEvent(type: EventType, h: number, note?: string): IssueEvent {
  return {
    id: crypto.randomUUID(),
    type,
    at: hoursAgo(h),
    actor: 'resident',
    note,
  }
}

function seed(): StoredIssue[] {
  const base = [
    {
      ref: 'MAT-CPT-0107',
      municipalityCode: 'CPT',
      municipalityName: 'Cape Town',
      category: 'pothole' as Category,
      title: 'Deep pothole in left lane',
      description:
        'About 40cm wide, cars swerving into oncoming traffic after dark.',
      location: 'Voortrekker Rd near Elsies River Station',
      ward: '25',
      events: [
        seedEvent('logged', 24 * 19),
        seedEvent(
          'reported_to_municipality',
          24 * 19 - 1,
          'Logged via the City app',
        ),
        seedEvent('municipal_reference_added', 24 * 19 - 1, 'Ref 9112458730'),
        seedEvent('community_confirmed', 24 * 12),
        seedEvent('community_confirmed', 24 * 6),
        seedEvent('still_unresolved', 24 * 2, 'Getting bigger after the rain'),
      ],
      confirmers: ['a', 'b', 'c', 'd', 'e'],
      municipalReference: '9112458730',
    },
    {
      ref: 'MAT-CPT-0112',
      municipalityCode: 'CPT',
      municipalityName: 'Cape Town',
      category: 'streetlight' as Category,
      title: 'Three streetlights out on one block',
      description:
        'Whole stretch is dark between the school and the taxi rank.',
      location: 'Lansdowne Rd, Philippi',
      ward: '80',
      events: [
        seedEvent('logged', 24 * 8),
        seedEvent('community_confirmed', 24 * 5),
      ],
      confirmers: ['a', 'b'],
    },
    {
      ref: 'MAT-CPT-0119',
      municipalityCode: 'CPT',
      municipalityName: 'Cape Town',
      category: 'water' as Category,
      title: 'Burst pipe running for days',
      description:
        'Clean water flowing into the stormwater drain since the weekend.',
      location: 'Corner of Main Rd & Belmont Rd, Rondebosch',
      ward: '59',
      events: [
        seedEvent('logged', 70),
        seedEvent('reported_to_municipality', 69),
        seedEvent('community_confirmed', 40),
        seedEvent(
          'resident_reports_fixed',
          6,
          'Crew on site this morning, water off',
        ),
      ],
      confirmers: ['a'],
      status: 'resident_reports_fixed' as const,
    },
    {
      ref: 'MAT-JHB-0044',
      municipalityCode: 'JHB',
      municipalityName: 'City of Johannesburg',
      category: 'water' as Category,
      title: 'No water supply for 4 days',
      description: 'Entire street without water, no notice given.',
      location: 'Melville, 7th Street',
      ward: '87',
      events: [
        seedEvent('logged', 24 * 4),
        seedEvent('community_confirmed', 24 * 3),
      ],
      confirmers: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'],
    },
  ]

  return base.map((b) => ({
    id: crypto.randomUUID(),
    ownerId: SEED_OWNER,
    sample: true,
    status: 'open',
    createdAt: b.events[0].at,
    ...b,
  }))
}

const globalStore = globalThis as unknown as {
  __matIssues?: StoredIssue[]
  __matCounter?: number
}
globalStore.__matIssues ??= seed()
globalStore.__matCounter ??= 120

const issues = globalStore.__matIssues

function toPublic(issue: StoredIssue, viewerId: string): Issue {
  const { ownerId, confirmers, ...rest } = issue
  return {
    ...rest,
    events: [...rest.events].sort((a, b) => a.at.localeCompare(b.at)),
    confirmations: confirmers.length,
    confirmedByMe: confirmers.includes(viewerId),
    isMine: ownerId === viewerId,
  }
}

export function listIssues(
  viewerId: string,
  opts: { municipality?: string; scope?: 'mine' | 'all' },
) {
  return issues
    .filter((i) =>
      opts.municipality ? i.municipalityCode === opts.municipality : true,
    )
    .filter((i) => (opts.scope === 'mine' ? i.ownerId === viewerId : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((i) => toPublic(i, viewerId))
}

export function getIssue(viewerId: string, id: string) {
  const issue = issues.find((i) => i.id === id)
  return issue ? toPublic(issue, viewerId) : null
}

export function createIssue(
  viewerId: string,
  input: {
    municipalityCode: string
    municipalityName: string
    category: Category
    title: string
    description: string
    location: string
    ward?: string
    photoUrl?: string
  },
) {
  const now = new Date().toISOString()
  globalStore.__matCounter! += 1
  const issue: StoredIssue = {
    id: crypto.randomUUID(),
    ref: `MAT-${input.municipalityCode}-${String(globalStore.__matCounter).padStart(4, '0')}`,
    ownerId: viewerId,
    confirmers: [],
    status: 'open',
    createdAt: now,
    events: [
      { id: crypto.randomUUID(), type: 'logged', at: now, actor: 'you' },
    ],
    ...input,
  }
  issues.push(issue)
  return toPublic(issue, viewerId)
}

export function applyAction(viewerId: string, id: string, action: IssueAction) {
  const issue = issues.find((i) => i.id === id)
  if (!issue) return null
  const actor = issue.ownerId === viewerId ? 'you' : 'resident'
  const push = (type: EventType, note?: string) =>
    issue.events.push({
      id: crypto.randomUUID(),
      type,
      at: new Date().toISOString(),
      actor,
      note,
    })

  switch (action.type) {
    case 'confirm':
      if (issue.ownerId === viewerId || issue.confirmers.includes(viewerId))
        break
      issue.confirmers.push(viewerId)
      push('community_confirmed')
      break
    case 'still_unresolved':
      push('still_unresolved', action.note)
      if (issue.status === 'resident_reports_fixed') issue.status = 'open'
      break
    case 'reported_to_municipality':
      push('reported_to_municipality', action.note)
      break
    case 'municipal_reference':
      issue.municipalReference = action.reference
      push('municipal_reference_added', `Ref ${action.reference}`)
      break
    case 'resident_reports_fixed':
      issue.status = 'resident_reports_fixed'
      push('resident_reports_fixed', action.note)
      break
    case 'reminder': {
      const at = new Date(Date.now() + action.days * 86_400_000)
      issue.reminderAt = at.toISOString()
      push('reminder_set', `Check again in ${action.days} days`)
      break
    }
  }
  return toPublic(issue, viewerId)
}
