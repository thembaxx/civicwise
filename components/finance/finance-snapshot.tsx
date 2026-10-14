import Link from 'next/link'
import { ArrowUpRight, Bank, ShieldCheck } from '@phosphor-icons/react/dist/ssr'
import { Section, SourceNote } from '@/components/section'
import { getAuditOpinions, getFinances } from '@/lib/municipal-money'
import { financialYear, formatPercent, formatRand } from '@/lib/format'
import { auditTone, shortOpinion } from './audit-strip'
import { TrendChart } from './trend-chart'

export async function FinanceSnapshot({ code }: { code: string }) {
  const [years, audits] = await Promise.all([
    getFinances(code),
    getAuditOpinions(code),
  ])
  const latest = years[years.length - 1]
  const previous = years[years.length - 2]
  const action = (
    <Link href={`/m/${code}`} className="button-outline">
      Explore the finances <ArrowUpRight className="size-4" aria-hidden />
    </Link>
  )
  if (!latest)
    return (
      <Section
        title="Where the money went"
        eyebrow="PUBLIC MONEY, IN PLAIN SIGHT"
        icon={<Bank className="size-6" aria-hidden />}
        action={action}
      >
        <p className="text-base text-muted-foreground">
          Treasury has not published audited figures for this municipality yet.
        </p>
        <SourceNote />
      </Section>
    )

  const balance =
    latest.revenue !== undefined && latest.expenditure !== undefined
      ? latest.revenue - latest.expenditure
      : undefined
  const spendChange =
    previous?.expenditure && latest.expenditure !== undefined
      ? ((latest.expenditure - previous.expenditure) / previous.expenditure) *
        100
      : undefined
  const audit = audits[audits.length - 1]
  const clean = audit && auditTone(audit.label) === 'clean'
  return (
    <Section
      title="Where the money went"
      eyebrow="PUBLIC MONEY, IN PLAIN SIGHT"
      icon={<Bank className="size-6" aria-hidden />}
      description={`Audited operating figures for ${financialYear(latest.year)}. Public information, made easier to read.`}
      action={action}
      className="sm:p-9"
    >
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        <div className="flex flex-col gap-7">
          <dl className="grid grid-cols-2 gap-x-5 gap-y-7">
            <Figure
              label="Total spent"
              value={formatRand(latest.expenditure)}
              sub={
                spendChange !== undefined
                  ? `${formatPercent(spendChange)} on the previous audited year`
                  : 'Previous-year change unavailable'
              }
            />
            <Figure
              label="Total revenue"
              value={formatRand(latest.revenue)}
              sub="Money received by the municipality"
            />
            <div className="col-span-2 border-t border-border pt-5">
              <Figure
                label={
                  balance === undefined
                    ? 'Operating balance'
                    : balance >= 0
                      ? 'Operating surplus'
                      : 'Operating deficit'
                }
                value={formatRand(
                  balance === undefined ? undefined : Math.abs(balance),
                )}
                sub="Revenue less operating spending"
                positive={balance !== undefined && balance >= 0}
                alert={balance !== undefined && balance < 0}
                small
              />
            </div>
          </dl>
          <div className="flex items-start gap-3 rounded-xl bg-muted/60 p-4">
            <ShieldCheck
              className={`mt-0.5 size-5 shrink-0 ${clean ? 'text-positive' : 'text-muted-foreground'}`}
              aria-hidden
            />
            <div className="flex flex-col gap-1">
              <p
                className={`text-sm font-semibold ${clean ? 'text-positive' : ''}`}
              >
                {audit ? shortOpinion(audit.label) : 'Audit not published'}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {audit
                  ? `Latest published audit · ${financialYear(audit.year)}`
                  : 'No audit outcome is available from Treasury.'}
              </p>
            </div>
          </div>
        </div>
        <div className="min-w-0 rounded-2xl bg-background p-5 sm:p-6">
          <p className="mb-5 text-sm font-semibold">
            Revenue &amp; spending over time
          </p>
          <TrendChart years={years} />
        </div>
      </div>
      <div className="border-t border-border pt-5">
        <SourceNote />
      </div>
    </Section>
  )
}

function Figure({
  label,
  value,
  sub,
  alert = false,
  positive = false,
  small = false,
}: {
  label: string
  value: string
  sub: string
  alert?: boolean
  positive?: boolean
  small?: boolean
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={`font-sans font-medium tracking-[-.045em] tabular-nums ${small ? 'text-3xl' : 'text-[clamp(1.9rem,3.2vw,2.75rem)]'} ${alert ? 'text-destructive' : positive ? 'text-positive' : ''}`}
      >
        {value}
      </dd>
      <dd className="text-xs leading-relaxed text-muted-foreground">{sub}</dd>
    </div>
  )
}
