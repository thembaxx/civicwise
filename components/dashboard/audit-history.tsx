import type { AuditOpinion } from '@/lib/municipal-money'
import { cn } from '@/lib/utils'

type Grade = 'clean' | 'findings' | 'qualified' | 'serious' | 'outstanding'

function grade(label: string): Grade {
  const l = label.toLowerCase()
  if (l.includes('no findings')) return 'clean'
  if (l.startsWith('unqualified')) return 'findings'
  if (l.startsWith('qualified')) return 'qualified'
  if (l.includes('adverse') || l.includes('disclaimer')) return 'serious'
  return 'outstanding'
}

const GRADE_LABEL: Record<Grade, string> = {
  clean: 'Clean audit',
  findings: 'Unqualified with findings',
  qualified: 'Qualified',
  serious: 'Adverse / disclaimer',
  outstanding: 'Outstanding',
}

const GRADE_STYLE: Record<Grade, string> = {
  clean: 'bg-primary text-primary-foreground',
  findings: 'bg-primary/25 text-foreground',
  qualified: 'bg-accent text-accent-foreground',
  serious: 'bg-foreground text-background',
  outstanding: 'border border-dashed border-muted-foreground/50 text-muted-foreground',
}

export function AuditHistory({ opinions }: { opinions: AuditOpinion[] }) {
  if (opinions.length === 0) return null
  const recent = opinions.slice(-8)
  const latest = recent.at(-1)!

  return (
    <section aria-labelledby="audit-heading" className="rounded-xl border border-border bg-card p-4">
      <h2 id="audit-heading" className="text-base font-bold">
        Auditor-General track record
      </h2>
      <p className="mt-0.5 text-sm text-muted-foreground text-pretty">
        FY{latest.year}: <span className="font-medium text-foreground">{latest.label}</span>
      </p>
      <ol className="mt-4 grid grid-cols-4 gap-1.5 sm:grid-cols-8">
        {recent.map((o) => {
          const g = grade(o.label)
          return (
            <li
              key={o.year}
              className={cn('flex flex-col items-center rounded-md py-2', GRADE_STYLE[g])}
              title={o.label}
            >
              <span className="font-heading text-sm font-bold tabular-nums">{`'${String(o.year).slice(2)}`}</span>
              <span className="sr-only">{`FY${o.year}: ${o.label}`}</span>
            </li>
          )
        })}
      </ol>
      <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground" aria-label="Legend">
        {(['clean', 'findings', 'qualified', 'serious'] as Grade[]).map((g) => (
          <li key={g} className="flex items-center gap-1.5">
            <span className={cn('size-2.5 rounded-sm', GRADE_STYLE[g])} aria-hidden="true" />
            {GRADE_LABEL[g]}
          </li>
        ))}
      </ul>
    </section>
  )
}
