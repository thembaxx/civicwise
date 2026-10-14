'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DownloadSimple as Download } from '@phosphor-icons/react'
import { ReportCard } from './report-card'
import { useReports } from '@/lib/use-reports'
import { cn } from '@/lib/utils'

const FILTERS = [
  { id: 'open', label: 'Open' },
  { id: 'mine', label: 'My reports' },
  { id: 'fixed', label: 'Reported fixed' },
  { id: 'all', label: 'All' },
] as const
type Filter = (typeof FILTERS)[number]['id']

export function IssuesList({ code }: { code: string }) {
  const { reports, isLoading, error } = useReports(code)
  const [filter, setFilter] = useState<Filter>('open')

  const visible = reports.filter((r) => {
    if (filter === 'open') return !r.residentResolvedAt
    if (filter === 'fixed') return Boolean(r.residentResolvedAt)
    if (filter === 'mine') return r.isMine
    return true
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Filter reports">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
              filter === f.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Could not load reports. Pull to refresh or try again shortly.
        </p>
      ) : isLoading ? (
        <ul className="flex flex-col gap-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-24 animate-pulse rounded-xl bg-secondary" />
          ))}
        </ul>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border p-5">
          <p className="text-sm text-muted-foreground">Nothing here yet.</p>
          <Link href="/report" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">
            Log an issue
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
        </ul>
      )}

      <a
        href={`/api/reports/export?m=${code}`}
        className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-semibold"
      >
        <Download className="size-4" aria-hidden="true" /> Export history as CSV
      </a>
    </div>
  )
}
