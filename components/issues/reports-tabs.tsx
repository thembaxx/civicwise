'use client'

import { useState } from 'react'
import { DownloadSimple as Download } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { IssueList } from './issue-list'

const TABS = [
  { id: 'mine', label: 'Mine' },
  { id: 'all', label: 'Everyone' },
] as const

export function ReportsTabs() {
  const [scope, setScope] = useState<'mine' | 'all'>('mine')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div role="tablist" aria-label="Whose reports" className="flex rounded-full bg-muted p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={scope === t.id}
              onClick={() => setScope(t.id)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
                scope === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <a
          href={`/api/issues/export?scope=${scope}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
        >
          <Download className="size-3.5" aria-hidden />
          CSV
        </a>
      </div>
      <div role="tabpanel">
        <IssueList
          scope={scope}
          emptyText={
            scope === 'mine'
              ? 'You have not logged anything yet. Your first report starts your record.'
              : 'No reports yet.'
          }
        />
      </div>
    </div>
  )
}
