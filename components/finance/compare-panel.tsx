import type { AuditOpinion, FinanceYear } from '@/lib/municipal-money'
import { financialYear, formatPercent } from '@/lib/format'
import { shortOpinion } from './audit-strip'

type Side = { name: string; years: FinanceYear[]; audits: AuditOpinion[] }

function metrics({ years, audits }: Side) {
  const first = years[0]
  const last = years[years.length - 1]
  const growth = (a?: number, b?: number) => (a && b ? ((b - a) / a) * 100 : undefined)
  const staff = last?.breakdown.find((b) => b.code === '3100')?.amount
  const repairs = last?.breakdown.find((b) => b.code === '3800')?.amount
  return {
    span: first && last ? `${financialYear(first.year)}–${financialYear(last.year)}` : '—',
    revenueGrowth: growth(first?.revenue, last?.revenue),
    spendGrowth: growth(first?.expenditure, last?.expenditure),
    margin:
      last?.revenue && last.expenditure !== undefined
        ? ((last.revenue - last.expenditure) / last.revenue) * 100
        : undefined,
    staffShare: staff && last?.expenditure ? (staff / last.expenditure) * 100 : undefined,
    contractedShare: repairs && last?.expenditure ? (repairs / last.expenditure) * 100 : undefined,
    audit: audits.length ? shortOpinion(audits[audits.length - 1].label) : '—',
  }
}

export function ComparePanel({ a, b }: { a: Side; b: Side }) {
  const ma = metrics(a)
  const mb = metrics(b)
  const rows: { label: string; a: string; b: string }[] = [
    { label: 'Years compared', a: ma.span, b: mb.span },
    { label: 'Revenue growth', a: formatPercent(ma.revenueGrowth), b: formatPercent(mb.revenueGrowth) },
    { label: 'Spending growth', a: formatPercent(ma.spendGrowth), b: formatPercent(mb.spendGrowth) },
    { label: 'Operating surplus', a: formatPercent(ma.margin, 1), b: formatPercent(mb.margin, 1) },
    {
      label: 'Staff share of spending',
      a: ma.staffShare ? `${ma.staffShare.toFixed(0)}%` : '—',
      b: mb.staffShare ? `${mb.staffShare.toFixed(0)}%` : '—',
    },
    {
      label: 'Contracted services share',
      a: ma.contractedShare ? `${ma.contractedShare.toFixed(0)}%` : '—',
      b: mb.contractedShare ? `${mb.contractedShare.toFixed(0)}%` : '—',
    },
    { label: 'Latest audit', a: ma.audit, b: mb.audit },
  ]

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-muted-foreground">
          <th className="pb-2 font-medium">
            <span className="sr-only">Measure</span>
          </th>
          <th className="pb-2 pl-2 font-semibold text-foreground">{a.name}</th>
          <th className="pb-2 pl-2 font-semibold text-foreground">{b.name}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label} className="border-t border-border">
            <th scope="row" className="py-2.5 pr-2 text-left font-normal text-muted-foreground">
              {r.label}
            </th>
            <td className="py-2.5 pl-2 font-semibold tabular-nums">{r.a}</td>
            <td className="py-2.5 pl-2 font-semibold tabular-nums">{r.b}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
