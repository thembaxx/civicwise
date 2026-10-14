'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CircleNotch, Crosshair, MapPin, ShieldCheck, UserCircle } from '@phosphor-icons/react'

type Result = { wardNumber: string; label: string; address?: string; municipalityCode?: string; municipalityName?: string; province?: string; source: string; boundaryAvailable: boolean }

type Detail = { [key: string]: unknown } | null

export function WardSearch() {
  const [query, setQuery] = useState('')
  const [municipalityCode, setMunicipalityCode] = useState('')
  const [wardNumber, setWardNumber] = useState('')
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
  function openWardRecord() { const code = municipalityCode.trim().toUpperCase(); const ward = wardNumber.trim(); if (!code || !/^\\d{1,3}$/.test(ward)) return setMessage('Enter a municipality code and ward number, for example CPT and 63.'); window.location.href = `/ward/${encodeURIComponent(code)}/${encodeURIComponent(ward)}` }

  return <div className="flex flex-col gap-4">
    <div className="flex gap-2"><input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229 && query.trim()) search(`q=${encodeURIComponent(query.trim())}`) }} placeholder="Search an address or suburb" className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-3 text-base" aria-label="Address or suburb" /><button onClick={() => search(`q=${encodeURIComponent(query.trim())}`)} disabled={!query.trim() || loading} className="rounded-xl bg-primary px-4 font-bold text-primary-foreground">{loading ? <CircleNotch className="size-5 animate-spin" /> : 'Search'}</button></div>
    <button onClick={locate} className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold"><Crosshair weight="bold" className="size-5" /> Use my location</button>
    <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4"><p className="text-sm font-bold">Already know your ward?</p><p className="mt-1 text-xs text-muted-foreground">Open a record directly with the IEC municipality code and ward number.</p><div className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2"><input value={municipalityCode} onChange={(e) => setMunicipalityCode(e.target.value)} placeholder="CPT" aria-label="Municipality code" className="min-w-0 rounded-xl border border-input bg-background px-3 py-2 text-sm uppercase" /><input value={wardNumber} onChange={(e) => setWardNumber(e.target.value.replace(/\\D/g, '').slice(0, 3))} onKeyDown={(e) => { if (e.key === 'Enter') openWardRecord() }} placeholder="Ward no." aria-label="Ward number" inputMode="numeric" className="min-w-0 rounded-xl border border-input bg-background px-3 py-2 text-sm" /><button onClick={openWardRecord} className="rounded-xl bg-secondary px-3 py-2 text-sm font-bold text-secondary-foreground">Open</button></div></div>
    {message && <p role="status" className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">{message}</p>}
    {results.map((result, index) => <div key={`${result.label}-${index}`} className="rounded-2xl border border-border bg-card p-4"><div className="flex items-start gap-3"><div className="rounded-full bg-accent p-2 text-accent-foreground"><MapPin weight="fill" className="size-5" /></div><div className="min-w-0"><p className="font-heading text-xl font-extrabold">{result.label}</p><p className="mt-1 text-sm text-muted-foreground">{result.address ?? 'Located from your device'}</p>{result.province && <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{result.province}</p>}</div></div><div className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground"><ShieldCheck weight="fill" className="size-4 text-primary" /> Boundary confirmed by {result.source}</div>{result.wardNumber && <><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => showDetails(result, index)} className="flex items-center justify-center gap-2 rounded-xl bg-secondary px-3 py-2 text-center text-sm font-bold text-secondary-foreground">{detailLoading === index ? <CircleNotch className="size-4 animate-spin" /> : <UserCircle className="size-4" />} Quick view</button>{result.municipalityCode && <Link href={`/ward/${encodeURIComponent(result.municipalityCode)}/${encodeURIComponent(result.wardNumber)}`} className="flex items-center justify-center rounded-xl border border-border px-3 py-2 text-center text-sm font-bold transition-colors hover:bg-muted">Full record</Link>}</div>{details[index] && <WardDetails detail={details[index]} />}{details[index] === null && <p className="mt-3 text-xs text-muted-foreground">IEC ward detail data is not available for this result yet.</p>}</>}</div>)}
  </div>
}

function WardDetails({ detail }: { detail: Detail }) {
  const entries = Object.entries(detail ?? {}).filter(([key, value]) => value !== null && value !== undefined && value !== '').slice(0, 8)
  return <div className="mt-3 rounded-xl bg-muted p-3"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">IEC ward record</p><dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">{entries.map(([key, value]) => <div key={key} className="min-w-0"><dt className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{key.replace(/([A-Z])/g, ' $1')}</dt><dd className="truncate text-sm font-medium">{String(value)}</dd></div>)}</dl></div>
}
