import type { FinanceYear } from '@/lib/municipal-money'
import { formatRand } from '@/lib/format'

export function SpendBreakdown({ year }: { year: FinanceYear }) {
  const total = year.breakdown.reduce((sum, b) => sum + b.amount, 0) || 1
  const top = year.breakdown.slice(0, 6)

  return (
    <ul className="flex flex-col gap-3">
      {top.map((b) => {
        const share = (b.amount / total) * 100
        return (
          <li key={b.code} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{b.label}</span>
              <span className="tabular-nums text-muted-foreground">
                {formatRand(b.amount)} · {share.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-chart-1" style={{ width: `${share}%` }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
