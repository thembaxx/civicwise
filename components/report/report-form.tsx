'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSWRConfig } from 'swr'
import { Crosshair, Info, Loader2 } from 'lucide-react'
import { CATEGORY_ICON } from '@/components/issue-meta'
import { CATEGORIES, CATEGORY_LABEL, type Category } from '@/lib/reports'
import { cn } from '@/lib/utils'

const inputClass =
  'w-full rounded-lg border border-input bg-card px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring'

export function ReportForm({
  code,
  municipalityName,
  phone,
}: {
  code: string
  municipalityName: string
  phone?: string
}) {
  const router = useRouter()
  const { mutate } = useSWRConfig()
  const [category, setCategory] = useState<Category>('pothole')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function locate() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: +pos.coords.latitude.toFixed(5), lng: +pos.coords.longitude.toFixed(5) })
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setSubmitting(true)
    setErrors({})
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        municipality: code,
        category,
        title: form.get('title'),
        location: form.get('location'),
        ward: form.get('ward'),
        description: form.get('description'),
        ...coords,
      }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      setErrors(json.errors ?? { form: 'Something went wrong. Please try again.' })
      setSubmitting(false)
      return
    }
    await mutate(`/api/reports?m=${code}`)
    router.push(`/issues/${json.report.id}?new=1`)
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">What&apos;s the problem?</legend>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICON[c]
            const selected = category === c
            return (
              <label
                key={c}
                className={cn(
                  'flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 px-1 py-3 text-center text-xs font-semibold leading-tight transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring',
                  selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card',
                )}
              >
                <input
                  type="radio"
                  name="category"
                  value={c}
                  checked={selected}
                  onChange={() => setCategory(c)}
                  className="sr-only"
                />
                <Icon className="size-6" aria-hidden="true" />
                {CATEGORY_LABEL[c]}
              </label>
            )
          })}
        </div>
      </fieldset>

      <Field label="Short title" id="title" error={errors.title}>
        <input id="title" name="title" required maxLength={80} placeholder="e.g. Deep pothole in left lane" className={inputClass} />
      </Field>

      <Field label="Where is it?" id="location" error={errors.location}>
        <input
          id="location"
          name="location"
          required
          maxLength={120}
          placeholder="Street, nearest number or landmark"
          className={inputClass}
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={locate}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium"
          >
            {locating ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Crosshair className="size-4" aria-hidden="true" />
            )}
            {coords ? 'Location pinned' : 'Pin my location'}
          </button>
          {coords ? (
            <span className="text-xs tabular-nums text-muted-foreground">
              {coords.lat}, {coords.lng}
            </span>
          ) : null}
        </div>
      </Field>

      <Field label="Ward (optional)" id="ward">
        <input id="ward" name="ward" inputMode="numeric" maxLength={10} placeholder="e.g. 57" className={inputClass} />
      </Field>

      <Field label="Details (optional)" id="description">
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={600}
          placeholder="Size, hazard, how long it's been there"
          className={cn(inputClass, 'leading-relaxed')}
        />
      </Field>

      <aside className="flex gap-3 rounded-xl bg-accent/40 p-3.5 text-sm leading-relaxed">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          This creates your own timestamped record. It does <strong>not</strong> open a ticket with {municipalityName}.
          Report it to them too{phone ? ` (${phone})` : ''}, then add their reference number to link the two.
        </p>
      </aside>

      {errors.form ? <p className="text-sm font-medium text-destructive">{errors.form}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-heading text-base font-bold text-primary-foreground disabled:opacity-70"
      >
        {submitting ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : null}
        Log &amp; timestamp report
      </button>
    </form>
  )
}

function Field({
  label,
  id,
  error,
  children,
}: {
  label: string
  id: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
