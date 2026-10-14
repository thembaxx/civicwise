import type { FinanceYear } from '@/lib/municipal-money'
import { formatRand } from '@/lib/reports'
import { cn } from '@/lib/utils'

function Row({ label, value, strong, hint }: { label: string; value: string; strong?: boolean; hint?: string }) {
  return (
    <div className="flex items-baseline gap-2 py-2">
      <dt className={cn('text-sm', strong ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{label}</dt>
      <span aria-hidden="true" className="mb-1 flex-1 border-b border-dotted border-muted-foreground/40" />
      <dd className="text-right">
        <span className={cn('font-heading tabular-nums', strong ? 'text-lg font-bold' : 'text-base font-semibold')}>
          {value}
        </span>
        {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
      </dd>
    </div>
  )
}

export function LedgerSummary({ finances }: { finances: FinanceYear[] }) {
  const latest = finances.at(-1)
  const previous = finances.at(-2)

  if (!latest?.revenue || !latest.expenditure) {
    return (
      <section className="rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground">
        Audited financial statements are not yet available for this municipality on Municipal Money.
      </section>
    )
  }

  const surplus = latest.revenue - latest.expenditure
  const expenditureChange =
    previous?.expenditure ? ((latest.expenditure - previous.expenditure) / previous.expenditure) * 100 : null
  const budgetUse = latest.budgetedExpenditure ? (latest.expenditure / latest.budgetedExpenditure) * 100 : null

  return (
    <section aria-labelledby="ledger-heading" className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between bg-primary px-4 py-2.5 text-primary-foreground">
        <h2 id="ledger-heading" className="text-sm font-bold uppercase tracking-wider">
          Statement · FY{latest.year}
        </h2>
        <span className="text-xs opacity-80">Audited actuals</span>
      </div>
      <dl className="divide-y divide-border px-4 py-1">
        <Row label="Operating revenue" value={formatRand(latest.revenue)} />
        <Row
          label="Operating spending"
          value={formatRand(latest.expenditure)}
          hint={
            expenditureChange !== null
              ? `${expenditureChange >= 0 ? '+' : ''}${expenditureChange.toFixed(1)}% vs FY${previous!.year}`
              : undefined
          }
        />
        <Row label={surplus >= 0 ? 'Surplus' : 'Deficit'} value={formatRand(surplus)} strong />
      </dl>
      {budgetUse !== null ? (
        <div className="border-t border-border bg-secondary/60 px-4 py-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">Spent vs original budget</span>
            <span className="font-heading font-bold tabular-nums">{budgetUse.toFixed(0)}%</span>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-border"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={150}
            aria-valuenow={Math.round(budgetUse)}
            aria-label="Operating spending as a share of original budget"
          >
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(budgetUse, 100)}%` }} />
          </div>
        </div>
      ) : null}
    </section>
  )
}
