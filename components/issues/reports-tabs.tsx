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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Whose reports"
          className="flex rounded-xl bg-muted p-1"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              aria-pressed={scope === t.id}
              onClick={() => setScope(t.id)}
              className={cn(
                'min-h-11 rounded-lg px-5 py-2 text-sm font-medium transition-colors',
                scope === t.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <a
          href={`/api/issues/export?scope=${scope}`}
          className="button-outline"
        >
          <Download className="size-4" aria-hidden />
          Export CSV
        </a>
      </div>
      <div>
        <IssueList
          columns
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
