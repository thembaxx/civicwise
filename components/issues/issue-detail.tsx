'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { BellRing, CheckCheck, Hash, MapPin, RotateCcw, ThumbsUp } from 'lucide-react'
import { CATEGORIES, EVENT_LABELS, type Issue, type IssueAction } from '@/lib/issues'
import { daysSince, formatDate, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { CATEGORY_ICONS, StatusBadge } from './issue-meta'
import { fetcher } from './issue-list'

const REMINDER_DAYS = [3, 7, 14, 30] as const

export function IssueDetail({ initial }: { initial: Issue }) {
  const { data, mutate } = useSWR<Issue>(`/api/issues/${initial.id}`, fetcher, { fallbackData: initial })
  const issue = data ?? initial
  const [pending, setPending] = useState<string | null>(null)
  const [reference, setReference] = useState('')
  const Icon = CATEGORY_ICONS[issue.category]
  const fixed = issue.status === 'resident_reports_fixed'

  async function act(action: IssueAction) {
    setPending(action.type)
    const res = await fetch(`/api/issues/${issue.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action),
    })
    if (res.ok) await mutate(await res.json(), { revalidate: false })
    setPending(null)
  }

  return (
    <div className="flex flex-col gap-5">
      <article className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between gap-3 bg-secondary px-4 py-3 text-secondary-foreground">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
            <Icon className="size-4 text-primary" aria-hidden />
            {CATEGORIES[issue.category].label} · {issue.municipalityName}
          </span>
          <span className="text-xs tabular-nums opacity-80">{issue.ref}</span>
        </div>
        <div className="flex flex-col gap-3 p-4">
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-balance">{issue.title}</h1>
          <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              {issue.location}
              {issue.ward && ` · Ward ${issue.ward}`}
            </span>
          </p>
          {issue.description && <p className="text-sm leading-relaxed text-pretty">{issue.description}</p>}
          <StatusBadge issue={issue} className="self-start" />
        </div>
        <dl className="grid grid-cols-3 border-t-2 border-dashed border-border">
          <Stat label="Days open" value={fixed ? '—' : String(daysSince(issue.createdAt))} />
          <Stat label="Confirmed" value={String(issue.confirmations)} />
          <Stat label="Municipal ref" value={issue.municipalReference ?? 'None'} small />
        </dl>
      </article>

      <section aria-labelledby="actions-heading" className="flex flex-col gap-3">
        <h2 id="actions-heading" className="text-base font-bold">
          Update the record
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {!issue.isMine && (
            <ActionButton
              icon={ThumbsUp}
              label={issue.confirmedByMe ? 'You confirmed' : 'I see it too'}
              disabled={issue.confirmedByMe || pending !== null}
              onClick={() => act({ type: 'confirm' })}
              primary={!issue.confirmedByMe}
            />
          )}
          <ActionButton
            icon={RotateCcw}
            label="Still unresolved"
            disabled={pending !== null}
            onClick={() => act({ type: 'still_unresolved' })}
          />
          {!fixed && (
            <ActionButton
              icon={CheckCheck}
              label="Looks fixed"
              disabled={pending !== null}
              onClick={() => act({ type: 'resident_reports_fixed' })}
            />
          )}
        </div>

        {!issue.municipalReference && (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (reference.trim().length >= 3) act({ type: 'municipal_reference', reference: reference.trim() })
            }}
          >
            <label className="relative flex flex-1 items-center">
              <span className="sr-only">Municipal reference number</span>
              <Hash className="pointer-events-none absolute left-3 size-4 text-muted-foreground" aria-hidden />
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                maxLength={40}
                placeholder="Add municipal reference"
                className="h-11 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <button
              type="submit"
              disabled={pending !== null || reference.trim().length < 3}
              className="h-11 rounded-xl bg-secondary px-4 text-sm font-semibold text-secondary-foreground disabled:opacity-50"
            >
              Save
            </button>
          </form>
        )}

        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <BellRing className="size-4" aria-hidden />
            {issue.reminderAt ? `Reminder on ${formatDate(issue.reminderAt)}` : 'Remind me to check again'}
          </p>
          <div className="flex gap-2" role="group" aria-label="Reminder interval">
            {REMINDER_DAYS.map((d) => (
              <button
                key={d}
                type="button"
                disabled={pending !== null}
                onClick={() => act({ type: 'reminder', days: d })}
                className="flex-1 rounded-lg border border-border py-2 text-xs font-semibold tabular-nums hover:bg-muted disabled:opacity-50"
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="history-heading" className="flex flex-col gap-3">
        <h2 id="history-heading" className="text-base font-bold">
          Timestamped history
        </h2>
        <ol className="relative flex flex-col gap-5 pl-7">
          <span aria-hidden className="road-line absolute bottom-2 left-[9px] top-2 w-1 rounded-full" />
          {[...issue.events].reverse().map((event) => (
            <li key={event.id} className="relative flex flex-col gap-0.5">
              <span
                aria-hidden
                className={cn(
                  'absolute -left-7 top-0.5 h-5 w-5 rounded-full border-4 border-background',
                  event.type === 'municipal_reference_added' || event.type === 'resident_reports_fixed'
                    ? 'bg-secondary'
                    : 'bg-primary',
                )}
              />
              <time dateTime={event.at} className="text-xs tabular-nums text-muted-foreground">
                {formatDateTime(event.at)}
              </time>
              <p className="text-sm font-semibold">
                {EVENT_LABELS[event.type]}
                <span className="font-normal text-muted-foreground">
                  {' · '}
                  {event.actor === 'you' ? 'You' : 'Resident'}
                </span>
              </p>
              {event.note && <p className="text-sm leading-relaxed text-muted-foreground">{event.note}</p>}
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 border-r border-border px-3 py-3 last:border-r-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={cn('truncate font-heading font-extrabold tabular-nums', small ? 'text-sm leading-6' : 'text-xl')}>
        {value}
      </dd>
    </div>
  )
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  primary,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  disabled?: boolean
  primary?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60',
        primary ? 'bg-primary text-primary-foreground' : 'border border-border bg-card hover:bg-muted',
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  )
}
