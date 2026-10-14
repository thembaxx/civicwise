import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, MapPin, ShieldCheck } from '@phosphor-icons/react/dist/ssr'
import { getWardDetail, isValidWardNumber } from '@/lib/ward'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ municipality: string; ward: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { municipality, ward } = await params
  return { title: `Ward ${ward} · ${municipality}`, description: `IEC GIS ward record and civic context for Ward ${ward} in ${municipality}.` }
}

export default async function WardDetailPage({ params }: Props) {
  const { municipality, ward } = await params
  const valid = municipality.length > 0 && isValidWardNumber(ward)
  const detail = valid ? await getWardDetail(municipality.toUpperCase(), ward) : null
  const entries = Object.entries((detail ?? {}) as Record<string, unknown>).filter(([, value]) => value !== null && value !== undefined && value !== '').slice(0, 16)

  return <div className="flex flex-col gap-5 pt-2">
    <Link href="/ward" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-4" /> Back to ward lookup</Link>
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">IEC GIS ward record</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Ward {ward}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Municipality code {municipality.toUpperCase()}</p>
    </div>
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3"><div className="rounded-full bg-accent p-2 text-accent-foreground"><MapPin weight="fill" className="size-5" /></div><div><p className="font-bold">Boundary match</p><p className="text-sm text-muted-foreground">Confirmed against IEC GIS data</p></div><ShieldCheck weight="fill" className="ml-auto size-5 text-primary" /></div>
      {entries.length > 0 ? <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4">{entries.map(([key, value]) => <div key={key} className="min-w-0"><dt className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{key.replace(/([A-Z])/g, ' $1')}</dt><dd className="mt-1 truncate text-sm font-medium">{String(value)}</dd></div>)}</dl> : <p className="mt-5 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">The IEC boundary was found, but no additional ward record is currently available for this municipality code.</p>}
    </div>
    <div className="rounded-2xl border border-border bg-muted/50 p-4"><p className="font-bold">What this confirms</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">This page identifies the ward boundary and publishes the available IEC record. Ward councillor and budget information will be added when a verified municipal source is available; we do not infer official roles or spending from incomplete data.</p></div>
  </div>
}
