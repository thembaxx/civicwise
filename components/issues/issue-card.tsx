'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useSWRConfig } from 'swr'
import {
  MapPin,
  Users,
  ArrowUpRight,
  ThumbsUp,
  CircleNotch,
  Check,
} from '@phosphor-icons/react'
import { CATEGORIES, type Issue } from '@/lib/issues'
import { daysSince } from '@/lib/format'
import { CATEGORY_ICONS, StatusBadge } from './issue-meta'

export function IssueCard({ issue }: { issue: Issue }) {
  const Icon = CATEGORY_ICONS[issue.category]
  const days = daysSince(issue.createdAt)
  const fixed = issue.status === 'resident_reports_fixed'
  const { mutate } = useSWRConfig()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function confirm() {
    setPending(true)
    setError('')
    try {
      const response = await fetch(`/api/issues/${issue.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'confirm' }),
      })
      if (!response.ok)
        throw new Error(
          'Your confirmation could not be saved. Please try again.',
        )
      await mutate(
        (key) => typeof key === 'string' && key.startsWith('/api/issues'),
      )
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <article className="issue-card flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-positive/50">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-positive-soft text-positive">
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="text-sm font-medium">
          {CATEGORIES[issue.category].label}
        </span>
        {issue.sample && (
          <span className="ml-auto rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground">
            Sample
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <h3 className="text-base font-semibold leading-snug">
          <Link
            href={`/reports/${issue.id}`}
            className="hover:underline underline-offset-4"
          >
            {issue.title}
          </Link>
        </h3>
        <p className="flex items-start gap-1.5 text-sm leading-relaxed text-muted-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            {issue.location}
            {issue.ward && ` · Ward ${issue.ward}`}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          {fixed
            ? 'Resident update recorded'
            : `Open for ${days} ${days === 1 ? 'day' : 'days'}`}{' '}
          · {issue.ref}
        </p>
      </div>
      <StatusBadge issue={issue} className="self-start" />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-4" aria-hidden />
          {issue.confirmations}{' '}
          {issue.confirmations === 1 ? 'confirmation' : 'confirmations'}
        </span>
        <Link href={`/reports/${issue.id}`} className="text-link">
          View record <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </div>
      {!issue.isMine && !fixed && (
        <button
          type="button"
          onClick={confirm}
          disabled={pending || issue.confirmedByMe}
          className="button-outline w-full text-sm disabled:opacity-70"
        >
          {pending ? (
            <CircleNotch className="size-4 animate-spin" aria-hidden />
          ) : issue.confirmedByMe ? (
            <Check className="size-4" aria-hidden />
          ) : (
            <ThumbsUp className="size-4" aria-hidden />
          )}
          {pending
            ? 'Confirming…'
            : issue.confirmedByMe
              ? 'You confirmed this'
              : 'I see it too'}
        </button>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </article>
  )
}
