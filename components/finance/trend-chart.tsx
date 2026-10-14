import type { FinanceYear } from '@/lib/municipal-money'
import { financialYear, formatRand } from '@/lib/format'

export function TrendChart({ years }: { years: FinanceYear[] }) {
  const recent = years.slice(-6)
  const max = Math.max(
    ...recent.flatMap((y) => [y.revenue ?? 0, y.expenditure ?? 0]),
    1,
  )

  return (
    <figure className="flex flex-col gap-4">
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-chart-1" />{' '}
          Revenue
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-chart-2" />{' '}
          Spending
        </span>
      </div>
      <div
        className="flex h-44 items-end gap-3 border-b border-border"
        role="img"
        aria-label="Audited revenue and spending by financial year"
      >
        {recent.map((y) => (
          <div
            key={y.year}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
          >
            <div className="flex h-full w-full items-end justify-center gap-0.5">
              <div
                className="w-1/2 max-w-5 rounded-t-sm bg-chart-1"
                style={{ height: `${((y.revenue ?? 0) / max) * 100}%` }}
                title={`Revenue ${formatRand(y.revenue)}`}
              />
              <div
                className="w-1/2 max-w-5 rounded-t-sm bg-chart-2"
                style={{ height: `${((y.expenditure ?? 0) / max) * 100}%` }}
                title={`Spending ${formatRand(y.expenditure)}`}
              />
            </div>
            <span className="pb-2 text-xs tabular-nums text-muted-foreground">
              {financialYear(y.year)}
            </span>
          </div>
        ))}
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
          View the figures
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <caption className="sr-only">Audited revenue and spending</caption>
            <thead>
              <tr>
                <th scope="col" className="py-2 pr-3">
                  Year
                </th>
                <th scope="col" className="py-2 pr-3">
                  Revenue
                </th>
                <th scope="col" className="py-2">
                  Spending
                </th>
              </tr>
            </thead>
            <tbody>
              {recent.map((y) => (
                <tr
                  key={y.year}
                  className="border-t border-border tabular-nums"
                >
                  <th scope="row" className="py-2 pr-3 font-normal">
                    {financialYear(y.year)}
                  </th>
                  <td className="py-2 pr-3">{formatRand(y.revenue)}</td>
                  <td className="py-2">{formatRand(y.expenditure)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  )
}
