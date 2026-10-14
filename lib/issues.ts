export const CATEGORIES = {
  pothole: { label: 'Pothole', hint: 'Road surface damage' },
  streetlight: { label: 'Streetlight', hint: 'Light out or flickering' },
  water: { label: 'Water', hint: 'Leak, burst pipe or no supply' },
  other: { label: 'Other', hint: 'Refuse, sewage, signage' },
} as const

export type Category = keyof typeof CATEGORIES

/**
 * Event types deliberately distinguish what a resident did from what the
 * municipality confirmed. We never infer municipal receipt or resolution.
 */
export type EventType =
  | 'logged'
  | 'reported_to_municipality'
  | 'municipal_reference_added'
  | 'community_confirmed'
  | 'still_unresolved'
  | 'resident_reports_fixed'
  | 'reminder_set'

export const EVENT_LABELS: Record<EventType, string> = {
  logged: 'Logged on Tracker',
  reported_to_municipality:
    'Resident says they reported it to the municipality',
  municipal_reference_added: 'Municipal reference number recorded',
  community_confirmed: 'Neighbour confirmed the problem',
  still_unresolved: 'Checked: still unresolved',
  resident_reports_fixed: 'Resident reports it fixed',
  reminder_set: 'Follow-up reminder set',
}

export type IssueEvent = {
  id: string
  type: EventType
  at: string
  actor: 'you' | 'resident'
  note?: string
}

export type IssueStatus = 'open' | 'resident_reports_fixed'

export type Issue = {
  id: string
  ref: string
  municipalityCode: string
  municipalityName: string
  category: Category
  title: string
  description: string
  location: string
  ward?: string
  photoUrl?: string
  createdAt: string
  status: IssueStatus
  municipalReference?: string
  reminderAt?: string
  confirmations: number
  confirmedByMe: boolean
  isMine: boolean
  sample?: boolean
  events: IssueEvent[]
}

export type IssueAction =
  | { type: 'confirm' }
  | { type: 'still_unresolved'; note?: string }
  | { type: 'reported_to_municipality'; note?: string }
  | { type: 'municipal_reference'; reference: string }
  | { type: 'resident_reports_fixed'; note?: string }
  | { type: 'reminder'; days: number }
