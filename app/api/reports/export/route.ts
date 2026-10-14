import type { NextRequest } from 'next/server'
import { listReports } from '@/lib/report-store'
import { CATEGORY_LABEL, daysOpen } from '@/lib/reports'
import { VISITOR_COOKIE } from '@/lib/session'

function csvCell(value: unknown) {
  const s = value === undefined || value === null ? '' : String(value)
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s
  return `"${safe.replace(/"/g, '""')}"`
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('m') ?? ''
  if (!/^[A-Z0-9]{2,8}$/.test(code)) return new Response('Invalid municipality', { status: 400 })
  const visitorId = req.cookies.get(VISITOR_COOKIE)?.value ?? ''
  const reports = listReports(code, visitorId)

  const header = [
    'reference',
    'logged_at_utc',
    'category',
    'title',
    'location',
    'ward',
    'latitude',
    'longitude',
    'community_confirmations',
    'municipal_reference',
    'municipality_acknowledged',
    'resident_reported_fixed_at_utc',
    'days_open',
    'timeline',
  ]
  const rows = reports.map((r) =>
    [
      r.ref,
      r.createdAt,
      CATEGORY_LABEL[r.category],
      r.title,
      r.location,
      r.ward,
      r.lat,
      r.lng,
      r.confirmations,
      r.municipalRef,
      'unverified',
      r.residentResolvedAt,
      daysOpen(r),
      r.timeline.map((t) => `${t.at} ${t.note}`).join(' | '),
    ]
      .map(csvCell)
      .join(','),
  )

  const date = new Date().toISOString().slice(0, 10)
  return new Response([header.join(','), ...rows].join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="mat-${code}-${date}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
