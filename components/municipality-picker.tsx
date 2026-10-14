'use client'

import { useTransition } from 'react'
import {
  CaretDown as ChevronDown,
  CircleNotch as Spinner,
  MapPin,
} from '@phosphor-icons/react'
import { followMunicipality } from '@/app/actions'

type Option = { code: string; name: string; province: string; category: string }

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

export function MunicipalityPicker({
  options,
  current,
}: {
  options: Option[]
  current: string
}) {
  const [pending, startTransition] = useTransition()
  const grouped = [...new Set(Object.values(PROVINCES))].map((name) => ({
    name,
    items: options.filter((o) => PROVINCES[o.province] === name),
  }))

  return (
    <div className="relative">
      <label htmlFor="followed-municipality" className="sr-only">
        Change followed municipality
      </label>
      <select
        id="followed-municipality"
        value={current}
        disabled={pending}
        onChange={(e) =>
          startTransition(() => followMunicipality(e.target.value))
        }
        className="h-11 w-full appearance-none rounded-xl border border-border bg-card pl-10 pr-10 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60"
      >
        {!options.some((option) => option.code === current) && (
          <option value={current}>{current}</option>
        )}
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
      <MapPin
        className="pointer-events-none absolute left-3 top-3 size-5 text-positive"
        aria-hidden
      />
      {pending ? (
        <Spinner
          className="pointer-events-none absolute right-3 top-3.5 size-4 animate-spin text-muted-foreground"
          aria-label="Loading"
        />
      ) : (
        <ChevronDown
          className="pointer-events-none absolute right-3 top-3.5 size-4 text-muted-foreground"
          aria-hidden="true"
        />
      )}
    </div>
  )
}
