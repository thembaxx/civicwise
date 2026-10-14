import type { AuditOpinion } from '@/lib/municipal-money'
import { financialYear } from '@/lib/format'
import { cn } from '@/lib/utils'

export function auditTone(label: string) {
  const l = label.toLowerCase()
  if (l.includes('no findings')) return 'clean'
  if (l.startsWith('unqualified')) return 'unqualified'
  if (l.includes('outstanding')) return 'missing'
  return 'poor'
}

export function shortOpinion(label: string) {
  const tone = auditTone(label)
  if (tone === 'clean') return 'Clean audit'
  if (tone === 'unqualified') return 'Unqualified, with findings'
  if (tone === 'missing') return 'Audit outstanding'
  return label.replace(/ - .*/, '')
}

const toneClass = {
  clean: 'bg-positive',
  unqualified: 'bg-[#96794a]',
  poor: 'bg-destructive',
  missing: 'bg-chart-3',
} as const

export function AuditStrip({ opinions }: { opinions: AuditOpinion[] }) {
  const recent = opinions.slice(-10)
  if (recent.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No audit outcomes published for this municipality.
      </p>
    )
  }
  const latest = recent[recent.length - 1]

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">
        <span className="font-semibold">{financialYear(latest.year)}:</span>{' '}
        {latest.label}
      </p>
      <ol className="flex gap-1" aria-label="Audit outcome history">
        {recent.map((o) => (
          <li key={o.year} className="flex flex-1 flex-col items-center gap-1">
            <span
              className={cn(
                'h-6 w-full rounded-sm',
                toneClass[auditTone(o.label)],
              )}
              title={`${financialYear(o.year)}: ${o.label}`}
            />
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {String(o.year).slice(2)}
            </span>
            <span className="sr-only">
              {financialYear(o.year)}: {o.label}
            </span>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-x-3 gap-y-2 text-xs text-muted-foreground">
        <Legend className="bg-positive" label="Clean" />
        <Legend className="bg-[#96794a]" label="Findings" />
        <Legend className="bg-destructive" label="Qualified or worse" />
        <Legend className="bg-chart-3" label="Outstanding" />
      </div>
    </div>
  )
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span aria-hidden className={cn('h-2 w-2 rounded-sm', className)} />
      {label}
    </span>
  )
}
