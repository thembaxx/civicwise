'use client'

import Link from 'next/link'
import useSWR from 'swr'
import type { Issue } from '@/lib/issues'
import { IssueCard } from './issue-card'

export const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Request failed')
    return r.json()
  })

export function IssueList({
  scope,
  municipality,
  limit,
  emptyText,
}: {
  scope: 'mine' | 'all'
  municipality?: string
  limit?: number
  emptyText: string
}) {
  const params = new URLSearchParams({ scope })
  if (municipality) params.set('m', municipality)
  const { data, error, isLoading } = useSWR<Issue[]>(`/api/issues?${params}`, fetcher)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true">
        {[0, 1].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }
  if (error) return <p className="text-sm text-destructive">Could not load reports.</p>

  const items = limit ? (data ?? []).slice(0, limit) : (data ?? [])
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border p-4">
        <p className="text-sm leading-relaxed text-muted-foreground">{emptyText}</p>
        <Link
          href="/report"
          className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
        >
          Log a problem
        </Link>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((issue) => (
        <li key={issue.id}>
          <IssueCard issue={issue} />
        </li>
      ))}
    </ul>
  )
}
