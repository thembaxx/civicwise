import Link from 'next/link'
import { MapPin, Users } from 'lucide-react'
import { CategoryBadge, StatusPill } from '@/components/issue-meta'
import { CATEGORY_LABEL, daysOpen, type Report } from '@/lib/reports'

export function ReportCard({ report }: { report: Report }) {
  const days = daysOpen(report)
  return (
    <li>
      <Link
        href={`/issues/${report.id}`}
        className="flex gap-3 rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-primary/50"
      >
        <CategoryBadge category={report.category} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-pretty text-sm font-semibold leading-snug">{report.title}</h3>
            <span className="shrink-0 text-right font-heading text-lg font-bold leading-none tabular-nums">
              {days}
              <span className="block text-[11px] font-medium text-muted-foreground">days</span>
            </span>
          </div>
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {report.location}
              {report.ward ? ` · Ward ${report.ward}` : ''}
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill report={report} />
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="size-3.5" aria-hidden="true" />
              {report.confirmations}
              <span className="sr-only">confirmations</span>
            </span>
            <span className="text-xs text-muted-foreground">{CATEGORY_LABEL[report.category]}</span>
            {report.sample ? (
              <span className="rounded border border-border px-1.5 text-[11px] text-muted-foreground">Sample</span>
            ) : null}
          </div>
        </div>
      </Link>
    </li>
  )
}
