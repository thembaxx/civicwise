'use client'

import { useDeferredValue, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Search } from 'lucide-react'
import type { Municipality } from '@/lib/municipal-money'

const PROVINCES: Record<string, string> = {
  EC: 'Eastern Cape',
  FS: 'Free State',
  GT: 'Gauteng',
  KZN: 'KwaZulu-Natal',
  LIM: 'Limpopo',
  MP: 'Mpumalanga',
  NC: 'Northern Cape',
  NW: 'North West',
  WC: 'Western Cape',
}

export function MunicipalitySearch({ municipalities, followed }: { municipalities: Municipality[]; followed: string }) {
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
        <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by town, metro or province"
          className="h-12 w-full rounded-xl border border-input bg-card pl-10 pr-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {results.length} municipalities
      </p>
      <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {results.slice(0, 80).map((m) => (
          <li key={m.code}>
            <Link href={`/m/${m.code}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold">{m.name}</span>
                <span className="text-xs text-muted-foreground">
                  {PROVINCES[m.province] ?? m.province} · {m.category === 'A' ? 'Metro' : 'Local'}
                  {m.code === followed && ' · Following'}
                </span>
              </span>
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
