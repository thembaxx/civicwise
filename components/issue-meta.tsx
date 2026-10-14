import { Question, TrafficCone as Construction, Drop as Droplets, Lightbulb, Trash as Trash2, Waves, type Icon } from '@phosphor-icons/react'
import type { Category, Report } from '@/lib/reports'
import { cn } from '@/lib/utils'

export const CATEGORY_ICON: Record<Category, Icon> = {
  pothole: Construction,
  streetlight: Lightbulb,
  water: Droplets,
  sewage: Waves,
  refuse: Trash2,
  other: Question,
}

export function CategoryBadge({ category, className }: { category: Category; className?: string }) {
  const Icon = CATEGORY_ICON[category]
  return (
    <span
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground',
        className,
      )}
    >
      <Icon className="size-5" aria-hidden="true" />
    </span>
  )
}

export function reportStatus(r: Report) {
  if (r.residentResolvedAt) return { label: 'Resident reports fixed', tone: 'done' as const }
  if (r.municipalRef) return { label: 'Municipal ref on file', tone: 'ref' as const }
  if (r.confirmations >= 3) return { label: 'Community confirmed', tone: 'confirmed' as const }
  return { label: 'Logged', tone: 'logged' as const }
}

export function StatusPill({ report }: { report: Report }) {
  const status = reportStatus(report)
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        status.tone === 'done' && 'bg-primary text-primary-foreground',
        status.tone === 'ref' && 'bg-accent text-accent-foreground',
        status.tone === 'confirmed' && 'bg-secondary text-secondary-foreground ring-1 ring-primary/40',
        status.tone === 'logged' && 'bg-secondary text-muted-foreground',
      )}
    >
      {status.label}
    </span>
  )
}
