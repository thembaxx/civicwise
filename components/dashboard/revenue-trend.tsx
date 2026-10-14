import type { FinanceYear } from '@/lib/municipal-money'
import { formatRand } from '@/lib/reports'

export function RevenueTrend({ finances }: { finances: FinanceYear[] }) {
  const years = finances.filter((f) => f.revenue && f.expenditure)
  if (years.length < 2) return null
  const max = Math.max(...years.flatMap((y) => [y.revenue!, y.expenditure!]))

  return (
    <section aria-labelledby="trend-heading" className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <h2 id="trend-heading" className="text-base font-bold">
          Revenue vs spending
        </h2>
        <div className="flex shrink-0 gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-primary" aria-hidden="true" /> Revenue
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-foreground/70" aria-hidden="true" /> Spending
          </span>
        </div>
      </div>
      <ul className="mt-4 flex flex-col gap-4">
        {years.map((y) => (
          <li key={y.year} className="flex items-center gap-3">
            <span className="w-12 shrink-0 font-heading text-sm font-semibold tabular-nums">FY{String(y.year).slice(2)}</span>
            <div className="flex flex-1 flex-col gap-1.5">
              <Bar value={y.revenue!} max={max} className="bg-primary" label={`Revenue FY${y.year}`} />
              <Bar value={y.expenditure!} max={max} className="bg-foreground/70" label={`Spending FY${y.year}`} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Bar({ value, max, className, label }: { value: number; max: number; className: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-3 flex-1 rounded-sm bg-secondary">
        <div className={`h-full rounded-sm ${className}`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span className="w-16 text-right text-xs font-medium tabular-nums text-muted-foreground">
        <span className="sr-only">{label}: </span>
        {formatRand(value)}
      </span>
    </div>
  )
}
