import {
  Drop as Droplet,
  Lightbulb,
  Trash as Trash2,
  TrafficCone,
  type Icon,
} from '@phosphor-icons/react'
import type { Category, Issue } from '@/lib/issues'
import { cn } from '@/lib/utils'

export const CATEGORY_ICONS: Record<Category, Icon> = {
  pothole: TrafficCone,
  streetlight: Lightbulb,
  water: Droplet,
  other: Trash2,
}

export function StatusBadge({
  issue,
  className,
}: {
  issue: Issue
  className?: string
}) {
  const fixed = issue.status === 'resident_reports_fixed'
  const label = fixed
    ? 'Resident reports fixed'
    : issue.municipalReference
      ? 'Open · has municipal ref'
      : 'Open · no municipal ref'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium leading-snug',
        fixed ? 'bg-positive-soft text-positive' : 'bg-muted text-foreground',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'h-1.5 w-1.5 shrink-0 rounded-full',
          fixed ? 'bg-positive' : 'bg-muted-foreground',
        )}
      />
      {label}
    </span>
  )
}
