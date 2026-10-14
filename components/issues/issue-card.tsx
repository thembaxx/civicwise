import Link from 'next/link'
import { MapPin, Users } from 'lucide-react'
import { CATEGORIES, type Issue } from '@/lib/issues'
import { daysSince } from '@/lib/format'
import { CATEGORY_ICONS, StatusBadge } from './issue-meta'

export function IssueCard({ issue }: { issue: Issue }) {
  const Icon = CATEGORY_ICONS[issue.category]
  const days = daysSince(issue.createdAt)
  const fixed = issue.status === 'resident_reports_fixed'

  return (
    <Link
      href={`/reports/${issue.id}`}
      className="group flex overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/30"
    >
      <div className="flex w-16 shrink-0 flex-col items-center justify-center gap-1 border-r-2 border-dashed border-border bg-muted px-2 py-3">
        <Icon className="size-5" aria-hidden />
        <span className="font-heading text-xl font-extrabold leading-none tabular-nums">{fixed ? '—' : days}</span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {fixed ? 'closed' : days === 1 ? 'day' : 'days'}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span className="font-semibold uppercase tracking-wider">{CATEGORIES[issue.category].label}</span>
          <span className="tabular-nums">{issue.ref}</span>
        </div>
        <p className="truncate text-sm font-semibold group-hover:underline">{issue.title}</p>
        <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{issue.location}</span>
        </p>
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <StatusBadge issue={issue} />
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="size-3.5" aria-hidden />
            <span className="tabular-nums">{issue.confirmations}</span>
            <span className="sr-only">confirmations</span>
          </span>
        </div>
      </div>
    </Link>
  )
}
