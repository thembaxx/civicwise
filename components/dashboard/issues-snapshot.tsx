'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { daysOpen } from '@/lib/reports'
import { useReports } from '@/lib/use-reports'

export function IssuesSnapshot({ code }: { code: string }) {
  const { reports, isLoading } = useReports(code)
  const open = reports.filter((r) => !r.residentResolvedAt)
  const oldest = open.reduce((max, r) => Math.max(max, daysOpen(r)), 0)
  const confirmations = open.reduce((sum, r) => sum + r.confirmations, 0)

  const stats = [
    { label: 'Open reports', value: open.length },
    { label: 'Neighbour confirmations', value: confirmations },
    { label: 'Oldest open (days)', value: oldest },
  ]

  return (
    <section aria-labelledby="snapshot-heading" className="rounded-xl bg-foreground p-4 text-background">
      <div className="flex items-center justify-between">
        <h2 id="snapshot-heading" className="text-base font-bold">
          On the ground
        </h2>
        <Link href="/issues" className="flex items-center gap-1 text-sm font-semibold text-accent">
          View issues <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg bg-background/10 p-3">
            <dt className="text-xs leading-snug opacity-75">{s.label}</dt>
            <dd className="mt-1 font-heading text-2xl font-bold tabular-nums">{isLoading ? '–' : s.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs leading-relaxed opacity-75">
        Resident-submitted records. Not confirmation that the municipality received or resolved an issue.
      </p>
    </section>
  )
}
