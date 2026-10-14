'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { NotePencil, ArrowUpRight, ArrowClockwise } from '@phosphor-icons/react'
import type { Issue } from '@/lib/issues'
import { cn } from '@/lib/utils'
import { IssueCard } from './issue-card'

export const fetcher = (url: string) =>
  fetch(url).then((response) => {
    if (!response.ok) throw new Error('Request failed')
    return response.json()
  })

export function IssueList({
  scope,
  municipality,
  limit,
  emptyText,
  columns = false,
  openOnly = false,
}: {
  scope: 'mine' | 'all'
  municipality?: string
  limit?: number
  emptyText: string
  columns?: boolean
  openOnly?: boolean
}) {
  const params = new URLSearchParams({ scope })
  if (municipality) params.set('m', municipality)
  const { data, error, isLoading, mutate } = useSWR<Issue[]>(
    `/api/issues?${params}`,
    fetcher,
  )
  if (isLoading)
    return (
      <div
        className={cn('grid gap-4', columns && 'sm:grid-cols-2')}
        aria-busy="true"
      >
        {[0, 1].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted/70" />
        ))}
        <span className="sr-only">Loading reports</span>
      </div>
    )
  if (error)
    return (
      <div
        role="alert"
        className="rounded-2xl border border-border bg-card p-5"
      >
        <p className="text-sm">Reports could not be loaded.</p>
        <button
          type="button"
          onClick={() => mutate()}
          className="text-link mt-3"
        >
          <ArrowClockwise className="size-4" aria-hidden />
          Try again
        </button>
      </div>
    )
  const filtered = openOnly
    ? (data ?? []).filter((issue) => issue.status === 'open')
    : (data ?? [])
  const items = limit ? filtered.slice(0, limit) : filtered
  if (!items.length)
    return (
      <div className="flex flex-col items-start gap-4 rounded-2xl border border-dashed border-border bg-card/60 p-5 sm:p-6">
        <NotePencil className="size-8 text-positive" aria-hidden />
        <p className="text-base font-medium">
          {scope === 'mine'
            ? 'A fresh start for your street.'
            : 'Be the first to share what you see.'}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {emptyText}
        </p>
        <Link href="/report" className="button-primary">
          Report a problem <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
    )
  return (
    <div className="flex flex-col gap-4">
      {items.some((issue) => issue.sample) && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Sample reports illustrate how records work. They are examples,
          separate from resident-submitted reports.
        </p>
      )}
      <ul className={cn('grid gap-4', columns && 'sm:grid-cols-2')}>
        {items.map((issue) => (
          <li key={issue.id} className="min-w-0">
            <IssueCard issue={issue} />
          </li>
        ))}
      </ul>
    </div>
  )
}
