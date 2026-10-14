import { Droplet, Lightbulb, Trash2, TrafficCone, type LucideIcon } from 'lucide-react'
import type { Category, Issue } from '@/lib/issues'
import { cn } from '@/lib/utils'

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  pothole: TrafficCone,
  streetlight: Lightbulb,
  water: Droplet,
  other: Trash2,
}

export function StatusBadge({ issue, className }: { issue: Issue; className?: string }) {
  const fixed = issue.status === 'resident_reports_fixed'
  const label = fixed
    ? 'Resident reports fixed'
    : issue.municipalReference
      ? 'Open · has municipal ref'
      : 'Open · no municipal ref'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold',
        fixed ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn('h-1.5 w-1.5 rounded-full', fixed ? 'bg-muted-foreground' : 'bg-primary-foreground')}
      />
      {label}
    </span>
  )
}
