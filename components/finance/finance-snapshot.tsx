import Link from 'next/link'
import { Section, SourceNote } from '@/components/section'
import { getAuditOpinions, getFinances } from '@/lib/municipal-money'
import { financialYear, formatPercent, formatRand } from '@/lib/format'
import { shortOpinion } from './audit-strip'
import { TrendChart } from './trend-chart'

export async function FinanceSnapshot({ code }: { code: string }) {
  const [years, audits] = await Promise.all([getFinances(code), getAuditOpinions(code)])
  const latest = years[years.length - 1]
  const previous = years[years.length - 2]

  if (!latest) {
    return (
      <Section title="Money">
        <p className="text-sm text-muted-foreground">Treasury has not published audited figures for this municipality yet.</p>
      </Section>
    )
  }

  const surplus = (latest.revenue ?? 0) - (latest.expenditure ?? 0)
  const spendChange =
    previous?.expenditure && latest.expenditure
      ? ((latest.expenditure - previous.expenditure) / previous.expenditure) * 100
      : undefined
  const audit = audits[audits.length - 1]

  return (
    <Section
      title="Where the money went"
      description={`Audited ${financialYear(latest.year)} financial year`}
      action={
        <Link href={`/m/${code}`} className="text-xs font-semibold underline underline-offset-2">
          Dashboard
        </Link>
      }
    >
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border">
        <Figure label="Spent" value={formatRand(latest.expenditure)} sub={`${formatPercent(spendChange)} on prior year`} />
        <Figure
          label={surplus >= 0 ? 'Operating surplus' : 'Operating deficit'}
          value={formatRand(Math.abs(surplus))}
          sub={`Revenue ${formatRand(latest.revenue)}`}
          alert={surplus < 0}
        />
        <Figure
          label="Latest audit"
          value={audit ? shortOpinion(audit.label) : '—'}
          sub={audit ? financialYear(audit.year) : 'Not published'}
          wide
        />
      </dl>
      <TrendChart years={years} />
      <SourceNote />
    </Section>
  )
}

function Figure({
  label,
  value,
  sub,
  alert,
  wide,
}: {
  label: string
  value: string
  sub: string
  alert?: boolean
  wide?: boolean
}) {
  return (
    <div className={`flex flex-col gap-0.5 bg-card p-3 ${wide ? 'col-span-2' : ''}`}>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={`font-heading text-xl font-extrabold tabular-nums ${alert ? 'text-destructive' : ''}`}>{value}</dd>
      <dd className="text-xs text-muted-foreground">{sub}</dd>
    </div>
  )
}
