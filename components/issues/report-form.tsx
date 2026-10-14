'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Crosshair as LocateFixed } from '@phosphor-icons/react'
import { CATEGORIES, type Category, type Issue } from '@/lib/issues'
import type { Municipality } from '@/lib/municipal-money'
import { cn } from '@/lib/utils'
import { CATEGORY_ICONS } from './issue-meta'

const fieldClass =
  'w-full rounded-xl border border-input bg-card px-3 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function ReportForm({ municipalities, defaultCode }: { municipalities: Municipality[]; defaultCode: string }) {
  const router = useRouter()
  const [category, setCategory] = useState<Category>('pothole')
  const [code, setCode] = useState(defaultCode)
  const [alreadyReported, setAlreadyReported] = useState(false)
  const [location, setLocation] = useState('')
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function useMyLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(`GPS ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`)
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const form = new FormData(e.currentTarget)
    const municipality = municipalities.find((m) => m.code === code)
    const res = await fetch('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category,
        municipalityCode: code,
        municipalityName: municipality?.name,
        title: form.get('title'),
        location,
        ward: form.get('ward'),
        description: form.get('description'),
      }),
    })
    const body = await res.json()
    if (!res.ok) {
      setError(body.error ?? 'Could not save this report')
      setSubmitting(false)
      return
    }
    const issue = body as Issue
    if (alreadyReported) {
      const reference = String(form.get('reference') ?? '').trim()
      await fetch(`/api/issues/${issue.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'reported_to_municipality' }),
      })
      if (reference) {
        await fetch(`/api/issues/${issue.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'municipal_reference', reference }),
        })
      }
    }
    router.push(`/reports/${issue.id}`)
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-sm font-semibold">What&apos;s the problem?</legend>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(CATEGORIES) as Category[]).map((key) => {
            const Icon = CATEGORY_ICONS[key]
            const selected = category === key
            return (
              <label
                key={key}
                className={cn(
                  'flex cursor-pointer flex-col gap-2 rounded-xl border p-3 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring',
                  selected ? 'border-secondary bg-secondary text-secondary-foreground' : 'border-border bg-card',
                )}
              >
                <input
                  type="radio"
                  name="category"
                  value={key}
                  checked={selected}
                  onChange={() => setCategory(key)}
                  className="sr-only"
                />
                <Icon className={cn('size-5', selected && 'text-primary')} aria-hidden />
                <span className="flex flex-col">
                  <span className="text-sm font-semibold">{CATEGORIES[key].label}</span>
                  <span className={cn('text-xs', selected ? 'opacity-75' : 'text-muted-foreground')}>
                    {CATEGORIES[key].hint}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="municipality" className="text-sm font-semibold">
          Municipality
        </label>
        <select id="municipality" value={code} onChange={(e) => setCode(e.target.value)} className={fieldClass}>
          {municipalities.map((m) => (
            <option key={m.code} value={m.code}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="text-sm font-semibold">
          Short title
        </label>
        <input id="title" name="title" required minLength={4} maxLength={90} placeholder="e.g. Streetlight out outside no. 14" className={fieldClass} />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="location" className="text-sm font-semibold">
            Where is it?
          </label>
          <button
            type="button"
            onClick={useMyLocation}
            className="inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2"
          >
            <LocateFixed className="size-3.5" aria-hidden />
            {locating ? 'Locating…' : 'Use my location'}
          </button>
        </div>
        <input
          id="location"
          name="location"
          required
          minLength={4}
          maxLength={140}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Street, nearest landmark or corner"
          className={fieldClass}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-1 flex flex-col gap-2">
          <label htmlFor="ward" className="text-sm font-semibold">
            Ward
          </label>
          <input id="ward" name="ward" inputMode="numeric" maxLength={6} placeholder="Optional" className={fieldClass} />
        </div>
        <p className="col-span-2 self-end pb-1 text-xs leading-relaxed text-muted-foreground">
          Ward lookup from IEC boundaries is coming. Linking a ward lets councillors see it.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-sm font-semibold">
          Details
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={600}
          placeholder="How bad is it, how long has it been like this?"
          className={cn(fieldClass, 'resize-none leading-relaxed')}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={alreadyReported}
            onChange={(e) => setAlreadyReported(e.target.checked)}
            className="mt-0.5 size-4 accent-current"
          />
          <span className="flex flex-col gap-0.5">
            <span className="font-semibold">I&apos;ve also reported this to the municipality</span>
            <span className="text-xs leading-relaxed text-muted-foreground">
              Add the reference number they gave you. It is the only proof we record that they received it.
            </span>
          </span>
        </label>
        {alreadyReported && (
          <input name="reference" maxLength={40} placeholder="Municipal reference number" aria-label="Municipal reference number" className={fieldClass} />
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="h-12 rounded-xl bg-primary text-base font-bold text-primary-foreground transition-opacity disabled:opacity-60"
      >
        {submitting ? 'Saving…' : 'Log with timestamp'}
      </button>
    </form>
  )
}
