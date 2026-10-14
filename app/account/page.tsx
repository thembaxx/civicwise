import type { Metadata } from 'next'
import {
  Check,
  DownloadSimple as Download,
} from '@phosphor-icons/react/dist/ssr'
import { getMunicipalityProfile } from '@/lib/municipal-money'
import { getFollowedCode } from '@/lib/session'
import { cn } from '@/lib/utils'
import { PageIntro } from '@/components/page-intro'

export const metadata: Metadata = { title: 'Account & plans' }

const PLANS = [
  {
    name: 'Free',
    price: 'R0',
    current: true,
    features: [
      'Follow one municipality',
      'Audited finance dashboard',
      'Unlimited issue reports',
      'Community confirmations',
      'CSV export of your history',
    ],
  },
  {
    name: 'Plus',
    price: 'R39',
    current: false,
    features: [
      'Follow up to 5 municipalities',
      'Side-by-side financial comparisons',
      'Email & SMS follow-up reminders',
      'Ward-level alerts for new reports',
      'Full multi-year export',
    ],
  },
]

export default async function AccountPage() {
  const code = await getFollowedCode()
  const profile = await getMunicipalityProfile(code)

  return (
    <div className="page-stack content-narrow">
      <PageIntro
        title="Your Civicwise"
        eyebrow="INDEPENDENT BY DESIGN"
        description="Your records, your municipality, and a little more clarity."
      />

      <section aria-labelledby="plans-heading" className="flex flex-col gap-3">
        <h2 id="plans-heading" className="sr-only">
          Plans
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className={cn(
                'panel flex flex-col gap-5 border border-border p-6',
                plan.current ? 'bg-card' : 'bg-muted/60',
              )}
            >
              <div className="flex items-baseline justify-between">
                <h3 className="editorial-title text-2xl">{plan.name}</h3>
                <p className="font-sans text-3xl font-medium tabular-nums">
                  {plan.price}
                  <span className="text-sm font-medium opacity-75">/month</span>
                </p>
              </div>
              <ul className="flex flex-col gap-2 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-positive"
                      aria-hidden="true"
                    />
                    {f}
                  </li>
                ))}
              </ul>
              {plan.current ? (
                <p className="rounded-xl bg-positive-soft py-3 text-center text-sm font-semibold text-positive">
                  Your current plan
                </p>
              ) : (
                <button disabled className="button-outline disabled:opacity-60">
                  Plus launches soon
                </button>
              )}
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="export-heading"
        className="panel flex flex-col gap-4 border border-border bg-card p-6"
      >
        <h2 id="export-heading" className="text-base font-bold">
          Your portable history
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Download every report for {profile?.name ?? code}, including
          timestamps, confirmations and municipal reference numbers. Useful for
          ward councillor meetings, ombud complaints or media.
        </p>
        <a
          href={`/api/reports/export?m=${code}`}
          className="button-primary self-start"
        >
          <Download className="size-4" aria-hidden="true" /> Download CSV
        </a>
      </section>

      <section
        aria-labelledby="inst-heading"
        className="panel border border-dashed border-border p-6"
      >
        <h2 id="inst-heading" className="text-base font-bold">
          For councillors, newsrooms &amp; NGOs
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Institutional dashboards with ward-level aggregation and API access
          are on the roadmap.
        </p>
      </section>

      <section
        aria-labelledby="about-heading"
        className="text-sm leading-relaxed text-muted-foreground"
      >
        <h2 id="about-heading" className="mb-1 font-semibold text-foreground">
          About the data
        </h2>
        <p>
          Financial and audit data from National Treasury&apos;s Municipal Money
          API, reused free of charge under its terms. Ward boundaries from the
          IEC. Issue reports are submitted by residents; Civicwise is
          independent and cannot confirm whether a municipality received or
          resolved a report.
        </p>
      </section>
    </div>
  )
}
