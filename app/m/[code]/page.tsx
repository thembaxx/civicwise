import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  ArrowSquareOut as ExternalLink,
  Phone,
} from '@phosphor-icons/react/dist/ssr'
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
import { PageIntro } from '@/components/page-intro'

type Props = {
  params: Promise<{ code: string }>
  searchParams: Promise<{ vs?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const profile = await getMunicipalityProfile(code.toUpperCase())
  return { title: profile ? `${profile.name} finances` : 'Municipality' }
}

export default async function MunicipalityPage({
  params,
  searchParams,
}: Props) {
  const code = (await params).code.toUpperCase()
  const { vs } = await searchParams
  const [profile, followed] = await Promise.all([
    getMunicipalityProfile(code),
    getFollowedCode(),
  ])
  if (!profile) notFound()

  return (
    <div className="page-stack">
      <section className="flex flex-col gap-5">
        <PageIntro
          title={profile.name}
          eyebrow={`${profile.province} · ${profile.code}`}
          description="A clearer view of public money and the problems residents are keeping track of."
          action={<FollowButton code={code} following={followed === code} />}
        />
        <div className="flex flex-wrap gap-3 text-sm">
          {profile.phone && (
            <a
              href={`tel:${profile.phone.replace(/\s/g, '')}`}
              className="button-outline"
            >
              <Phone className="size-3.5" aria-hidden />
              {profile.phone}
            </a>
          )}
          {profile.url && (
            <a
              href={
                profile.url.startsWith('http')
                  ? profile.url
                  : `https://${profile.url}`
              }
              target="_blank"
              rel="noreferrer"
              className="button-outline"
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
        <CompareSection
          code={code}
          name={profile.name}
          vs={vs?.toUpperCase()}
        />
      </Suspense>

      <Section
        title="Community reports"
        description="Residents' timestamped records in this municipality"
      >
        <IssueList
          scope="all"
          municipality={code}
          columns
          emptyText="No reports logged here yet."
        />
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
        <p className="text-sm text-muted-foreground">
          No audited figures published yet.
        </p>
      </Section>
    )
  }

  const plannedGrowth =
    budget && latest.expenditure
      ? ((budget.amount - latest.expenditure) / latest.expenditure) * 100
      : undefined

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Section
        className="lg:col-span-2"
        eyebrow="AUDITED OPERATING FIGURES"
        title="Revenue vs spending"
        description={`${financialYear(latest.year)} · mSCOA figures published by National Treasury`}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Mini
            label={`Revenue ${financialYear(latest.year)}`}
            value={formatRand(latest.revenue)}
          />
          <Mini
            label={`Spent ${financialYear(latest.year)}`}
            value={formatRand(latest.expenditure)}
          />
          <Mini label="Financial year" value={financialYear(latest.year)} />
        </div>
        <TrendChart years={years} />
      </Section>

      {budget && budget.year > latest.year && (
        <Section
          className="lg:col-span-2"
          title="What they plan to spend next"
          description={`${budget.adjusted ? 'Adjusted' : 'Original'} ${financialYear(budget.year)} budget vs last audited year. Check back after the audit to see if they kept to it.`}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Mini
              label={`Spent ${financialYear(latest.year)}`}
              value={formatRand(latest.expenditure)}
            />
            <Mini
              label={`Budget ${financialYear(budget.year)}`}
              value={formatRand(budget.amount)}
            />
            <Mini label="Change" value={formatPercent(plannedGrowth, 1)} />
          </div>
        </Section>
      )}

      <Section
        title="What the money paid for"
        description={`Largest spending lines, ${financialYear(latest.year)}`}
      >
        <SpendBreakdown year={latest} />
      </Section>

      <Section
        title="Auditor-General outcomes"
        description="Published audit opinions, with the relevant financial year"
      >
        <AuditStrip opinions={audits} />
      </Section>
    </div>
  )
}

async function CompareSection({
  code,
  name,
  vs,
}: {
  code: string
  name: string
  vs?: string
}) {
  const municipalities = await getMunicipalities()
  const other =
    vs && vs !== code ? municipalities.find((m) => m.code === vs) : undefined
  const [a, b] = other
    ? await Promise.all([
        Promise.all([getFinances(code), getAuditOpinions(code)]),
        Promise.all([getFinances(other.code), getAuditOpinions(other.code)]),
      ])
    : [null, null]

  return (
    <Section
      title="Compare"
      description="Growth and shares, so a small town can stand next to a metro"
    >
      <form method="get" className="flex flex-wrap gap-3">
        <label htmlFor="vs" className="sr-only">
          Compare with
        </label>
        <select
          id="vs"
          name="vs"
          defaultValue={other?.code ?? ''}
          className="field min-w-0 flex-1 sm:max-w-md"
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
        <button type="submit" className="button-secondary">
          Compare
        </button>
      </form>
      {other && a && b ? (
        <div className="overflow-x-auto">
          <ComparePanel
            a={{ name, years: a[0], audits: a[1] }}
            b={{ name: other.name, years: b[0], audits: b[1] }}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Pick a neighbouring or similar municipality.
        </p>
      )}
    </Section>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-background p-4 sm:p-5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-sans text-2xl font-medium tracking-tight tabular-nums sm:text-3xl">
        {value}
      </span>
    </div>
  )
}
