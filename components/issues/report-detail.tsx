'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BellRinging as BellRing, Check, CheckCircle as CheckCircle2, Hash, Spinner, MapPin, Users } from '@phosphor-icons/react'
import { CategoryBadge } from '@/components/issue-meta'
import { CATEGORY_LABEL, daysOpen, formatStamp, type Report } from '@/lib/reports'
import { postAction, useReport } from '@/lib/use-reports'
import { cn } from '@/lib/utils'

export function ReportDetail({
  initial,
  municipalityName,
  isNew,
}: {
  initial: Report
  municipalityName: string
  isNew: boolean
}) {
  const { report = initial, mutate } = useReport(initial.id, initial)
  const [busy, setBusy] = useState<string | null>(null)
  const [refValue, setRefValue] = useState('')

  async function run(key: string, body: Record<string, unknown>) {
    setBusy(key)
    try {
      const data = await postAction(report.id, body)
      await mutate(data, { revalidate: false })
    } finally {
      setBusy(null)
    }
  }

  const ladder = [
    { label: 'Logged & timestamped', done: true, note: formatStamp(report.createdAt) },
    {
      label: 'Community confirmed',
      done: report.confirmations >= 3,
      note: `${report.confirmations} of 3 neighbours`,
    },
    {
      label: 'Municipal reference on file',
      done: Boolean(report.municipalRef),
      note: report.municipalRef ? `Ref ${report.municipalRef} · added by a resident` : 'Not yet linked',
    },
    {
      label: 'Resident reports fixed',
      done: Boolean(report.residentResolvedAt),
      note: report.residentResolvedAt ? formatStamp(report.residentResolvedAt) : 'Still open',
    },
  ]

  return (
    <div className="flex flex-col gap-4 pt-2">
      <Link href="/issues" className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Issue history
      </Link>

      {isNew ? (
        <p className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground" role="status">
          <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
          Logged. Now report it to {municipalityName} and add their reference below.
        </p>
      ) : null}

      <article className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-border">
        <header className="flex gap-3 p-4">
          <CategoryBadge category={report.category} className="size-12" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {CATEGORY_LABEL[report.category]}
              {report.sample ? ' · Sample' : ''}
            </p>
            <h1 className="text-balance font-heading text-xl font-bold leading-tight">{report.title}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              {report.location}
              {report.ward ? ` · Ward ${report.ward}` : ''}
            </p>
          </div>
        </header>
        {report.description ? <p className="px-4 pb-4 text-sm leading-relaxed">{report.description}</p> : null}

        <div className="perforated h-2.5 bg-secondary" aria-hidden="true" />
        <dl className="grid grid-cols-3 gap-px bg-border">
          <Stat label="Reference" value={report.ref.split('-').at(-1)!} small={report.ref} />
          <Stat label="Days open" value={String(daysOpen(report))} />
          <Stat label="Confirmed by" value={String(report.confirmations)} />
        </dl>
      </article>

      <section aria-labelledby="status-heading" className="rounded-xl border border-border bg-card p-4">
        <h2 id="status-heading" className="text-base font-bold">
          Status
        </h2>
        <ol className="mt-3 flex flex-col">
          {ladder.map((step, i) => (
            <li key={step.label} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    'flex size-6 items-center justify-center rounded-full border-2',
                    step.done ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card',
                  )}
                >
                  {step.done ? <Check className="size-3.5" aria-hidden="true" /> : null}
                </span>
                {i < ladder.length - 1 ? (
                  <span className={cn('w-0.5 flex-1', step.done ? 'bg-primary' : 'bg-border')} aria-hidden="true" />
                ) : null}
              </div>
              <div className="pb-4">
                <p className={cn('text-sm font-semibold', !step.done && 'text-muted-foreground')}>
                  {step.label}
                  <span className="sr-only">{step.done ? ' (done)' : ' (pending)'}</span>
                </p>
                <p className="text-xs text-muted-foreground">{step.note}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="rounded-lg bg-secondary px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          Municipal receipt and resolution are <strong className="text-foreground">unverified</strong>. We only record
          what residents submit.
        </p>
      </section>

      <section aria-label="Actions" className="flex flex-col gap-3">
        {!report.isMine && !report.residentResolvedAt ? (
          <button
            onClick={() => run('confirm', { action: 'confirm' })}
            disabled={report.confirmedByMe || busy !== null}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-accent font-heading font-bold text-accent-foreground disabled:opacity-60"
          >
            {busy === 'confirm' ? <Spinner className="size-5 animate-spin" aria-hidden="true" /> : <Users className="size-5" aria-hidden="true" />}
            {report.confirmedByMe ? 'You confirmed this' : 'I see this too'}
          </button>
        ) : null}

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (refValue.trim().length >= 3) run('ref', { action: 'municipal_ref', value: refValue }).then(() => setRefValue(''))
          }}
        >
          <label htmlFor="muni-ref" className="sr-only">
            Municipal reference number
          </label>
          <div className="relative flex-1">
            <Hash className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" aria-hidden="true" />
            <input
              id="muni-ref"
              value={refValue}
              onChange={(e) => setRefValue(e.target.value)}
              placeholder={report.municipalRef ? 'Update municipal ref' : 'Add municipal ref no.'}
              className="h-11 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-base"
            />
          </div>
          <button
            type="submit"
            disabled={busy !== null || refValue.trim().length < 3}
            className="h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            Save
          </button>
        </form>

        <div className="grid grid-cols-2 gap-2">
          <label className="sr-only" htmlFor="remind">
            Remind me to follow up
          </label>
          <div className="relative">
            <BellRing className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" aria-hidden="true" />
            <select
              id="remind"
              defaultValue=""
              disabled={busy !== null}
              onChange={(e) => {
                if (e.target.value) run('remind', { action: 'remind', days: Number(e.target.value) })
                e.target.value = ''
              }}
              className="h-11 w-full appearance-none rounded-lg border border-border bg-card pl-9 pr-2 text-sm font-medium"
            >
              <option value="" disabled>
                {report.reminderAt ? `Reminder ${formatStamp(report.reminderAt).slice(0, 6)}` : 'Remind me'}
              </option>
              <option value="3">In 3 days</option>
              <option value="7">In 7 days</option>
              <option value="14">In 14 days</option>
              <option value="30">In 30 days</option>
            </select>
          </div>
          <button
            onClick={() => run('resolved', { action: 'resolved' })}
            disabled={!report.isMine || Boolean(report.residentResolvedAt) || busy !== null}
            className="h-11 rounded-lg border border-border bg-card text-sm font-semibold disabled:text-muted-foreground disabled:opacity-60"
          >
            {report.residentResolvedAt ? 'Marked fixed' : 'Mark as fixed'}
          </button>
        </div>
      </section>

      <section aria-labelledby="timeline-heading" className="rounded-xl border border-border bg-card p-4">
        <h2 id="timeline-heading" className="text-base font-bold">
          Timestamped history
        </h2>
        <ol className="mt-3 flex flex-col gap-3">
          {[...report.timeline].reverse().map((t, i) => (
            <li key={`${t.at}-${i}`} className="flex flex-col border-l-2 border-border pl-3">
              <time dateTime={t.at} className="text-xs font-semibold tabular-nums text-muted-foreground">
                {formatStamp(t.at)}
              </time>
              <span className="text-sm">{t.note}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

function Stat({ label, value, small }: { label: string; value: string; small?: string }) {
  return (
    <div className="bg-secondary px-3 py-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="font-heading text-xl font-bold tabular-nums" title={small}>
        {value}
      </dd>
    </div>
  )
}
