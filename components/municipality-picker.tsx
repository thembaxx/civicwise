'use client'

import { useTransition } from 'react'
import { CaretDown as ChevronDown, Spinner } from '@phosphor-icons/react'
import { followMunicipality } from '@/app/actions'

type Option = { code: string; name: string; province: string; category: string }

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

export function MunicipalityPicker({ options, current }: { options: Option[]; current: string }) {
  const [pending, startTransition] = useTransition()
  const grouped = Object.entries(PROVINCES).map(([code, name]) => ({
    name,
    items: options.filter((o) => o.province === code),
  }))

  return (
    <div className="relative">
      <label htmlFor="municipality" className="sr-only">
        Change followed municipality
      </label>
      <select
        id="municipality"
        value={current}
        disabled={pending}
        onChange={(e) => startTransition(() => followMunicipality(e.target.value))}
        className="h-10 w-full appearance-none rounded-lg border border-border bg-card pl-3 pr-9 text-sm font-medium text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60"
      >
        {grouped.map((g) =>
          g.items.length ? (
            <optgroup key={g.name} label={g.name}>
              {g.items.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.name}
                  {o.category === 'A' ? ' (Metro)' : ''}
                </option>
              ))}
            </optgroup>
          ) : null,
        )}
      </select>
      {pending ? (
        <Spinner className="pointer-events-none absolute right-3 top-3 size-4 animate-spin text-muted-foreground" aria-label="Loading" />
      ) : (
        <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" aria-hidden="true" />
      )}
    </div>
  )
}
