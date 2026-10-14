import { ShieldCheck } from '@phosphor-icons/react/dist/ssr/ShieldCheck'

export function HonestyNote() {
  return (
    <aside className="flex gap-3 rounded-xl bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden />
      <p>
        <span className="font-semibold text-foreground">This is your record, not the municipality&apos;s.</span>{' '}
        We timestamp what residents report. We never mark an issue as received or resolved by the municipality
        unless you add their official reference.
      </p>
    </aside>
  )
}
