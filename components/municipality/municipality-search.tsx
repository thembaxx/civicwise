'use client'

import { useDeferredValue, useState } from 'react'
import Link from 'next/link'
import {
  CaretRight,
  MagnifyingGlass as Search,
  MapPin,
  Check,
} from '@phosphor-icons/react'
import type { Municipality } from '@/lib/municipal-money'

const PROVINCES: Record<string, string> = {
  EC: 'Eastern Cape',
  FS: 'Free State',
  GT: 'Gauteng',
  KZN: 'KwaZulu-Natal',
  KZ: 'KwaZulu-Natal',
  LIM: 'Limpopo',
  LP: 'Limpopo',
  MP: 'Mpumalanga',
  NC: 'Northern Cape',
  NW: 'North West',
  WC: 'Western Cape',
}

export function MunicipalitySearch({
  municipalities,
  followed,
}: {
  municipalities: Municipality[]
  followed: string
}) {
  const [query, setQuery] = useState('')
  const deferred = useDeferredValue(query.trim().toLowerCase())
  const results = municipalities.filter(
    (m) =>
      !deferred ||
      m.name.toLowerCase().includes(deferred) ||
      m.code.toLowerCase() === deferred ||
      PROVINCES[m.province]?.toLowerCase().includes(deferred),
  )

  return (
    <div className="flex flex-col gap-4">
      <label className="relative flex items-center">
        <span className="sr-only">Search municipalities</span>
        <Search
          className="pointer-events-none absolute left-3 size-4 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by town, metro or province"
          className="field pl-10"
        />
      </label>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {results.length} municipalities
      </p>
      {results.length === 0 && (
        <p className="panel border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
          {municipalities.length
            ? 'No municipalities match that search. Try a town name or province.'
            : 'The Treasury municipality list is temporarily unavailable. Please try again shortly.'}
        </p>
      )}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((m) => (
          <li key={m.code}>
            <Link
              href={`/m/${m.code}`}
              className="flex h-full items-center gap-3 rounded-2xl border border-border bg-card px-5 py-5 transition-colors hover:border-positive hover:bg-muted/40"
            >
              <MapPin className="size-5 shrink-0 text-positive" aria-hidden />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-semibold">{m.name}</span>
                <span className="mt-1 text-xs text-muted-foreground">
                  {PROVINCES[m.province] ?? m.province} ·{' '}
                  {m.category === 'A' ? 'Metro' : 'Local'}
                  {m.code === followed && (
                    <span className="mt-2 flex items-center gap-1 text-positive">
                      <Check className="size-3.5" aria-hidden />
                      Following
                    </span>
                  )}
                </span>
              </span>
              <CaretRight
                className="size-4 text-muted-foreground"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
