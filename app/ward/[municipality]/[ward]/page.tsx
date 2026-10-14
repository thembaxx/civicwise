import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, MapPin, ShieldCheck } from '@phosphor-icons/react/dist/ssr'
import { getWardDetail, isValidWardNumber } from '@/lib/ward'
import { PageIntro } from '@/components/page-intro'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ municipality: string; ward: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { municipality, ward } = await params
  return {
    title: `Ward ${ward} · ${municipality}`,
    description: `IEC GIS ward record and civic context for Ward ${ward} in ${municipality}.`,
  }
}

export default async function WardDetailPage({ params }: Props) {
  const { municipality, ward } = await params
  const valid = municipality.length > 0 && isValidWardNumber(ward)
  const detail = valid
    ? await getWardDetail(municipality.toUpperCase(), ward)
    : null
  const entries = Object.entries((detail ?? {}) as Record<string, unknown>)
    .filter(
      ([, value]) => value !== null && value !== undefined && value !== '',
    )
    .slice(0, 16)

  return (
    <div className="page-stack content-narrow">
      <Link
        href="/ward"
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to ward lookup
      </Link>
      <PageIntro
        title={`Ward ${ward}`}
        eyebrow="IEC GIS WARD RECORD"
        description={`Municipality code ${municipality.toUpperCase()}`}
      />
      <div className="panel border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-positive-soft p-3 text-positive">
            <MapPin className="size-5" aria-hidden />
          </div>
          <div>
            <p className="font-semibold">
              {entries.length ? 'IEC ward record' : 'Record unavailable'}
            </p>
            <p className="text-sm text-muted-foreground">
              {entries.length
                ? 'Information published by IEC GIS'
                : 'No verified record is available from IEC GIS'}
            </p>
          </div>
          {entries.length > 0 && (
            <ShieldCheck
              className="ml-auto size-5 shrink-0 text-positive"
              aria-hidden
            />
          )}
        </div>
        {entries.length > 0 ? (
          <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4">
            {entries.map(([key, value]) => (
              <div key={key} className="min-w-0">
                <dt className="break-words text-xs font-medium text-muted-foreground">
                  {key.replace(/([A-Z])/g, ' $1')}
                </dt>
                <dd className="mt-1 break-words text-sm font-medium">
                  {String(value)}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-5 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
            We could not retrieve a ward record for this municipality and ward
            number. No boundary or official role is inferred from missing data.
          </p>
        )}
      </div>
      <div className="panel bg-muted/50 p-6">
        <p className="font-semibold">About this information</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This page publishes the available IEC record. Ward councillor and
          budget information require a verified municipal source; we do not
          infer official roles or spending from incomplete data.
        </p>
      </div>
    </div>
  )
}
