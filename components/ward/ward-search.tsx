'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  CircleNotch,
  Crosshair,
  MapPin,
  ShieldCheck,
  UserCircle,
  ArrowUpRight,
} from '@phosphor-icons/react'

type Result = {
  wardNumber: string
  label: string
  address?: string
  municipalityCode?: string
  municipalityName?: string
  province?: string
  source: string
  boundaryAvailable: boolean
}
type Detail = Record<string, unknown> | null

export function WardSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [municipalityCode, setMunicipalityCode] = useState('')
  const [wardNumber, setWardNumber] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [details, setDetails] = useState<Record<number, Detail>>({})
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState<number | null>(null)
  const [message, setMessage] = useState('')

  async function search(params: string) {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch(`/api/ward/search?${params}`)
      if (!response.ok)
        throw new Error('Ward lookup is temporarily unavailable.')
      const data = await response.json()
      setResults(data.results ?? [])
      setDetails({})
      if (!data.results?.length)
        setMessage(
          'No ward boundary matched that location. Try a fuller address.',
        )
    } catch {
      setResults([])
      setMessage('Ward lookup is temporarily unavailable.')
    } finally {
      setLoading(false)
    }
  }

  async function showDetails(result: Result, index: number) {
    if (!result.municipalityCode || !result.wardNumber) return
    setDetailLoading(index)
    try {
      const response = await fetch(
        `/api/ward/detail?municipality=${encodeURIComponent(result.municipalityCode)}&ward=${result.wardNumber}`,
      )
      const data = response.ok ? await response.json() : null
      setDetails((current) => ({ ...current, [index]: data?.detail ?? null }))
    } catch {
      setDetails((current) => ({ ...current, [index]: null }))
    } finally {
      setDetailLoading(null)
    }
  }

  function locate() {
    if (!navigator.geolocation)
      return setMessage('Location is not supported on this device.')
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) =>
        search(
          `lat=${position.coords.latitude}&lng=${position.coords.longitude}`,
        ),
      () => {
        setLoading(false)
        setMessage('Location permission was not granted.')
      },
    )
  }

  function openWardRecord() {
    const code = municipalityCode.trim().toUpperCase()
    const ward = wardNumber.trim()
    if (!/^[A-Z0-9]{2,8}$/.test(code) || !/^\d{1,3}$/.test(ward))
      return setMessage(
        'Enter a municipality code and ward number, for example CPT and 63.',
      )
    router.push(`/ward/${encodeURIComponent(code)}/${encodeURIComponent(ward)}`)
  }

  return (
    <div className="flex flex-col gap-5">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (query.trim()) search(`q=${encodeURIComponent(query.trim())}`)
        }}
        className="flex gap-3"
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search an address or suburb"
          className="field min-w-0 flex-1"
          aria-label="Address or suburb"
        />
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="button-primary"
        >
          {loading ? (
            <CircleNotch className="size-5 animate-spin" aria-hidden />
          ) : null}
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>
      <button
        type="button"
        onClick={locate}
        disabled={loading}
        className="button-outline"
      >
        <Crosshair className="size-5" aria-hidden />
        Use my location
      </button>
      <div className="rounded-2xl bg-background p-5">
        <p className="text-base font-medium">Already know your ward?</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Open an IEC record with your municipality code and ward number.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            openWardRecord()
          }}
          className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          <label className="flex min-w-0 flex-col gap-2 text-xs font-medium">
            Municipality code
            <input
              value={municipalityCode}
              onChange={(event) => setMunicipalityCode(event.target.value)}
              placeholder="CPT"
              aria-label="Municipality code"
              className="field min-w-0 uppercase"
            />
          </label>
          <label className="flex min-w-0 flex-col gap-2 text-xs font-medium">
            Ward number
            <input
              value={wardNumber}
              onChange={(event) =>
                setWardNumber(event.target.value.replace(/\D/g, '').slice(0, 3))
              }
              placeholder="e.g. 63"
              aria-label="Ward number"
              inputMode="numeric"
              className="field min-w-0"
            />
          </label>
          <button
            type="submit"
            className="button-secondary col-span-2 self-end sm:col-span-1"
          >
            Open record <ArrowUpRight className="size-4" aria-hidden />
          </button>
        </form>
      </div>
      {message && (
        <p
          role="status"
          className="rounded-xl bg-muted p-4 text-sm leading-relaxed"
        >
          {message}
        </p>
      )}
      {results.map((result, index) => (
        <div
          key={`${result.label}-${index}`}
          className="panel border border-border bg-card p-5"
        >
          <div className="flex items-start gap-3">
            <MapPin
              className="mt-1 size-6 shrink-0 text-positive"
              aria-hidden
            />
            <div className="min-w-0">
              <h3 className="text-lg font-semibold">{result.label}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {result.address ?? 'Located from your device'}
              </p>
              {result.province && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {result.province}
                </p>
              )}
            </div>
          </div>
          <p className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0" aria-hidden />
            {result.boundaryAvailable
              ? `Boundary confirmed by ${result.source}`
              : `No ward boundary could be confirmed by ${result.source}`}
          </p>
          {result.wardNumber && (
            <>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => showDetails(result, index)}
                  disabled={detailLoading !== null}
                  className="button-secondary"
                >
                  {detailLoading === index ? (
                    <CircleNotch className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <UserCircle className="size-4" aria-hidden />
                  )}
                  Quick view
                </button>
                {result.municipalityCode && (
                  <Link
                    href={`/ward/${encodeURIComponent(result.municipalityCode)}/${encodeURIComponent(result.wardNumber)}`}
                    className="button-outline"
                  >
                    Full record <ArrowUpRight className="size-4" aria-hidden />
                  </Link>
                )}
              </div>
              {details[index] && <WardDetails detail={details[index]} />}
              {details[index] === null && (
                <p className="mt-4 text-sm text-muted-foreground">
                  IEC ward detail data is not available for this result yet.
                </p>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  )
}

function WardDetails({ detail }: { detail: Detail }) {
  const entries = Object.entries(detail ?? {})
    .filter(
      ([, value]) => value !== null && value !== undefined && value !== '',
    )
    .slice(0, 8)
  return (
    <div className="mt-4 rounded-xl bg-muted p-4">
      <p className="eyebrow text-muted-foreground">IEC ward record</p>
      <dl className="mt-3 grid grid-cols-2 gap-4">
        {entries.map(([key, value]) => (
          <div key={key} className="min-w-0">
            <dt className="break-words text-xs text-muted-foreground">
              {key.replace(/([A-Z])/g, ' $1')}
            </dt>
            <dd className="mt-1 break-words text-sm font-medium">
              {String(value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
