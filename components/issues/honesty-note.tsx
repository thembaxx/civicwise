import { ShieldCheck } from '@phosphor-icons/react/dist/ssr/ShieldCheck'

export function HonestyNote() {
  return (
    <aside className="flex gap-3 rounded-2xl border border-border px-5 py-5 text-sm leading-relaxed text-muted-foreground sm:px-6">
      <ShieldCheck
        className="mt-0.5 size-5 shrink-0 text-positive"
        aria-hidden
      />
      <p>
        <span className="font-semibold text-foreground">
          This is your record, not the municipality&apos;s.
        </span>{' '}
        We timestamp what residents report. We never mark an issue as received
        or resolved by the municipality unless you add their official reference.
      </p>
    </aside>
  )
}
