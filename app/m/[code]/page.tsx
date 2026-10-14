import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowSquareOut as ExternalLink, Phone } from '@phosphor-icons/react'
import { Section, SectionSkeleton, SourceNote } from '@/components/section'
import { FollowButton } from '@/components/municipality/follow-button'
import { IssueList } from '@/components/issues/issue-list'
import { TrendChart } from '@/components/finance/trend-chart'
import { SpendBreakdown } from '@/components/finance/spend-breakdown'
import { AuditStrip } from '@/components/finance/audit-strip'
import { ComparePanel } from '@/components/finance/compare-panel'
import {
  getAuditOpinions,
  getFinances,
  getLatestBudget,
  getMunicipalities,
  getMunicipalityProfile,
} from '@/lib/municipal-money'
import { financialYear, formatPercent, formatRand } from '@/lib/format'
import { getFollowedCode } from '@/lib/viewer'

type Props = { params: Promise<{ code: string }>; searchParams: Promise<{ vs?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const profile = await getMunicipalityProfile(code.toUpperCase())
  return { title: profile ? `${profile.name} finances` : 'Municipality' }
}

export default async function MunicipalityPage({ params, searchParams }: Props) {
  const code = (await params).code.toUpperCase()
  const { vs } = await searchParams
  const [profile, followed] = await Promise.all([getMunicipalityProfile(code), getFollowedCode()])
  if (!profile) notFound()

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3 pt-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {profile.province} · {profile.code}
            </p>
            <h1 className="text-3xl font-extrabold leading-none tracking-tight text-balance">{profile.name}</h1>
          </div>
          <FollowButton code={code} following={followed === code} />
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {profile.phone && (
            <a href={`tel:${profile.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-semibold">
              <Phone className="size-3.5" aria-hidden />
              {profile.phone}
            </a>
          )}
          {profile.url && (
            <a
              href={profile.url.startsWith('http') ? profile.url : `https://${profile.url}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-semibold"
            >
              <ExternalLink className="size-3.5" aria-hidden />
              Official site
            </a>
          )}
        </div>
      </section>

      <Suspense fallback={<SectionSkeleton rows={5} />}>
        <FinanceSections code={code} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton rows={6} />}>
        <CompareSection code={code} name={profile.name} vs={vs?.toUpperCase()} />
      </Suspense>

      <Section title="Community reports" description="Residents' timestamped records in this municipality">
        <IssueList scope="all" municipality={code} emptyText="No reports logged here yet." />
      </Section>

      <SourceNote />
    </div>
  )
}

async function FinanceSections({ code }: { code: string }) {
  const [years, audits, budget] = await Promise.all([
    getFinances(code),
    getAuditOpinions(code),
    getLatestBudget(code),
  ])
  const latest = years[years.length - 1]

  if (!latest) {
    return (
      <Section title="Finances">
        <p className="text-sm text-muted-foreground">No audited figures published yet.</p>
      </Section>
    )
  }

  const plannedGrowth =
    budget && latest.expenditure ? ((budget.amount - latest.expenditure) / latest.expenditure) * 100 : undefined

  return (
    <>
      <Section title="Revenue vs spending" description="Audited operating figures (mSCOA years published by Treasury)">
        <TrendChart years={years} />
      </Section>

      {budget && budget.year > latest.year && (
        <Section
          title="What they plan to spend next"
          description={`${budget.adjusted ? 'Adjusted' : 'Original'} ${financialYear(budget.year)} budget vs last audited year. Check back after the audit to see if they kept to it.`}
        >
          <div className="grid grid-cols-3 gap-2">
            <Mini label={`Spent ${financialYear(latest.year)}`} value={formatRand(latest.expenditure)} />
            <Mini label={`Budget ${financialYear(budget.year)}`} value={formatRand(budget.amount)} />
            <Mini label="Change" value={formatPercent(plannedGrowth, 1)} />
          </div>
        </Section>
      )}

      <Section title="What the money paid for" description={`Largest spending lines, ${financialYear(latest.year)}`}>
        <SpendBreakdown year={latest} />
      </Section>

      <Section title="Auditor-General outcomes" description="A clean audit means the books can be trusted">
        <AuditStrip opinions={audits} />
      </Section>
    </>
  )
}

async function CompareSection({ code, name, vs }: { code: string; name: string; vs?: string }) {
  const municipalities = await getMunicipalities()
  const other = vs && vs !== code ? municipalities.find((m) => m.code === vs) : undefined
  const [a, b] = other
    ? await Promise.all([
        Promise.all([getFinances(code), getAuditOpinions(code)]),
        Promise.all([getFinances(other.code), getAuditOpinions(other.code)]),
      ])
    : [null, null]

  return (
    <Section title="Compare" description="Growth and shares, so a small town can stand next to a metro">
      <form method="get" className="flex gap-2">
        <label htmlFor="vs" className="sr-only">
          Compare with
        </label>
        <select
          id="vs"
          name="vs"
          defaultValue={other?.code ?? ''}
          className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-card px-3 text-sm"
        >
          <option value="" disabled>
            Compare with…
          </option>
          {municipalities
            .filter((m) => m.code !== code)
            .map((m) => (
              <option key={m.code} value={m.code}>
                {m.name}
              </option>
            ))}
        </select>
        <button type="submit" className="h-11 rounded-xl bg-secondary px-4 text-sm font-semibold text-secondary-foreground">
          Compare
        </button>
      </form>
      {other && a && b ? (
        <ComparePanel
          a={{ name, years: a[0], audits: a[1] }}
          b={{ name: other.name, years: b[0], audits: b[1] }}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Pick a neighbouring or similar municipality.</p>
      )}
    </Section>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl bg-muted p-3">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="font-heading text-lg font-extrabold tabular-nums">{value}</span>
    </div>
  )
}
