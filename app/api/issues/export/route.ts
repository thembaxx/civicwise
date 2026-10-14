import type { NextRequest } from 'next/server'
import { CATEGORIES, EVENT_LABELS } from '@/lib/issues'
import { listIssues } from '@/lib/issues-store'
import { getViewerId } from '@/lib/viewer'

function csvCell(value: string | number | undefined) {
  const s = value === undefined ? '' : String(value)
  // Prefix formula-like values so spreadsheets don't execute them.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s
  return `"${safe.replace(/"/g, '""')}"`
}

export async function GET(request: NextRequest) {
  const viewerId = await getViewerId()
  const scope = request.nextUrl.searchParams.get('scope') === 'all' ? 'all' : 'mine'
  const issues = listIssues(viewerId, { scope })

  const header = [
    'reference',
    'municipality',
    'category',
    'title',
    'location',
    'ward',
    'municipal_reference',
    'tracker_status',
    'confirmations',
    'event_time_utc',
    'event',
    'event_note',
  ]
  const rows = issues.flatMap((i) =>
    i.events.map((e) => [
      i.ref,
      i.municipalityName,
      CATEGORIES[i.category].label,
      i.title,
      i.location,
      i.ward,
      i.municipalReference,
      i.status === 'resident_reports_fixed' ? 'Resident reports fixed' : 'Open',
      i.confirmations,
      e.at,
      EVENT_LABELS[e.type],
      e.note,
    ]),
  )

  const csv = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n')
  const date = new Date().toISOString().slice(0, 10)
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="municipal-reports-${date}.csv"`,
    },
  })
}
