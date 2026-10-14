import type { FinanceYear } from '@/lib/municipal-money'
import { formatRand } from '@/lib/reports'

export function SpendingBreakdown({ finances }: { finances: FinanceYear[] }) {
  const latest = finances.at(-1)
  if (!latest?.expenditure || latest.breakdown.length === 0) return null
  const total = latest.expenditure
  const top = latest.breakdown.slice(0, 6)

  return (
    <section aria-labelledby="spend-heading" className="rounded-xl border border-border bg-card p-4">
      <h2 id="spend-heading" className="text-base font-bold">
        Where the money went
      </h2>
      <p className="mt-0.5 text-sm text-muted-foreground">Largest operating cost lines, FY{latest.year}</p>
      <ul className="mt-4 flex flex-col gap-3">
        {top.map((item) => {
          const share = (item.amount / total) * 100
          return (
            <li key={item.code}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-medium">{item.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatRand(item.amount)} · <span className="font-semibold text-foreground">{share.toFixed(0)}%</span>
                </span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-secondary" aria-hidden="true">
                <div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
