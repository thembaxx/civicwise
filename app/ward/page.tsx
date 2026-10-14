import type { Metadata } from 'next'
import { Section, SourceNote } from '@/components/section'
import { WardSearch } from '@/components/ward/ward-search'

export const metadata: Metadata = { title: 'Find your ward', description: 'Find a South African ward from your address or device location using IEC GIS boundaries.' }

export default function WardPage() {
  return <div className="flex flex-col gap-5 pt-2"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">IEC boundary lookup</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight">Find your ward</h1><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Search your address or use your location to see the ward boundary around you, then explore local money and community reports.</p></div><Section title="Where are you?" description="Your address is sent to a geocoder only to find coordinates. We do not save it."><WardSearch /></Section><Section title="What you will see" description="Independent context, not an official service-ticket system"><ul className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground"><li><strong className="text-foreground">Ward match.</strong> The IEC GIS boundary is used to identify the ward around a point.</li><li><strong className="text-foreground">Nearby wards.</strong> Search again with a nearby address to compare surrounding areas.</li><li><strong className="text-foreground">Accountability context.</strong> Municipal finance and resident reports are shown separately and clearly sourced.</li></ul></Section><SourceNote /></div>
}
