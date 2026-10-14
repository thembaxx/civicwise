'use client'

import { useState } from 'react'
import { CircleNotch, Crosshair, MapPin, ShieldCheck, UserCircle } from '@phosphor-icons/react'

type Result = { wardNumber: string; label: string; address?: string; municipalityCode?: string; municipalityName?: string; province?: string; source: string; boundaryAvailable: boolean }

type Detail = { [key: string]: unknown } | null

export function WardSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [details, setDetails] = useState<Record<number, Detail>>({})
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState<number | null>(null)
  const [message, setMessage] = useState('')

  async function search(params: string) {
    setLoading(true); setMessage('')
    try { const response = await fetch(`/api/ward/search?${params}`); const data = await response.json(); setResults(data.results ?? []); setDetails({}); if (!data.results?.length) setMessage('No ward boundary matched that location. Try a fuller address.') }
    catch { setMessage('Ward lookup is temporarily unavailable.') } finally { setLoading(false) }
  }

  async function showDetails(result: Result, index: number) {
    if (!result.municipalityCode || !result.wardNumber) return
    setDetailLoading(index)
    try {
      const response = await fetch(`/api/ward/detail?municipality=${encodeURIComponent(result.municipalityCode)}&ward=${result.wardNumber}`)
      const data = response.ok ? await response.json() : null
      setDetails((current) => ({ ...current, [index]: data?.detail ?? null }))
    } catch { setDetails((current) => ({ ...current, [index]: null })) }
    finally { setDetailLoading(null) }
  }

  function locate() { if (!navigator.geolocation) return setMessage('Location is not supported on this device.'); setLoading(true); navigator.geolocation.getCurrentPosition((p) => search(`lat=${p.coords.latitude}&lng=${p.coords.longitude}`), () => { setLoading(false); setMessage('Location permission was not granted.') }) }

  return <div className="flex flex-col gap-4">
    <div className="flex gap-2"><input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229 && query.trim()) search(`q=${encodeURIComponent(query.trim())}`) }} placeholder="Search an address or suburb" className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-3 text-base" aria-label="Address or suburb" /><button onClick={() => search(`q=${encodeURIComponent(query.trim())}`)} disabled={!query.trim() || loading} className="rounded-xl bg-primary px-4 font-bold text-primary-foreground">{loading ? <CircleNotch className="size-5 animate-spin" /> : 'Search'}</button></div>
    <button onClick={locate} className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold"><Crosshair weight="bold" className="size-5" /> Use my location</button>
    {message && <p role="status" className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">{message}</p>}
    {results.map((result, index) => <div key={`${result.label}-${index}`} className="rounded-2xl border border-border bg-card p-4"><div className="flex items-start gap-3"><div className="rounded-full bg-accent p-2 text-accent-foreground"><MapPin weight="fill" className="size-5" /></div><div className="min-w-0"><p className="font-heading text-xl font-extrabold">{result.label}</p><p className="mt-1 text-sm text-muted-foreground">{result.address ?? 'Located from your device'}</p>{result.province && <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{result.province}</p>}</div></div><div className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground"><ShieldCheck weight="fill" className="size-4 text-primary" /> Boundary confirmed by {result.source}</div>{result.wardNumber && <><button onClick={() => showDetails(result, index)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-3 py-2 text-center text-sm font-bold text-secondary-foreground">{detailLoading === index ? <CircleNotch className="size-4 animate-spin" /> : <UserCircle className="size-4" />} View ward details</button>{details[index] && <WardDetails detail={details[index]} />}{details[index] === null && <p className="mt-3 text-xs text-muted-foreground">IEC ward detail data is not available for this result yet.</p>}</>}</div>)}
  </div>
}

function WardDetails({ detail }: { detail: Detail }) {
  const entries = Object.entries(detail ?? {}).filter(([key, value]) => value !== null && value !== undefined && value !== '').slice(0, 8)
  return <div className="mt-3 rounded-xl bg-muted p-3"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">IEC ward record</p><dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">{entries.map(([key, value]) => <div key={key} className="min-w-0"><dt className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{key.replace(/([A-Z])/g, ' $1')}</dt><dd className="truncate text-sm font-medium">{String(value)}</dd></div>)}</dl></div>
}
