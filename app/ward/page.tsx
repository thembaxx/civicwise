import type { Metadata } from 'next'
import { Section } from '@/components/section'
import { PageIntro } from '@/components/page-intro'
import { WardSearch } from '@/components/ward/ward-search'

export const metadata: Metadata = {
  title: 'Find your ward',
  description:
    'Find a South African ward from your address or device location using IEC GIS boundaries.',
}

export default function WardPage() {
  return (
    <div className="page-stack content-narrow">
      <PageIntro
        title="Find your ward"
        eyebrow="A LITTLE CLOSER TO HOME"
        description="Search an address or use your location to find your ward, with boundary information from IEC GIS."
      />
      <Section
        title="Where are you?"
        description="Your address is sent to a geocoder only to find coordinates. We do not save it."
      >
        <WardSearch />
      </Section>
      <Section
        title="What you will see"
        variant="stone"
        description="Independent context, separate from official service tickets"
      >
        <ul className="flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground">
          <li>
            <strong className="text-foreground">Ward match.</strong> IEC GIS
            boundaries identify the ward around a point when a match is
            available.
          </li>
          <li>
            <strong className="text-foreground">Nearby wards.</strong> Search a
            nearby address to explore the surrounding area.
          </li>
          <li>
            <strong className="text-foreground">
              Clearly sourced information.
            </strong>{' '}
            Municipal finances and resident reports remain separate from
            official ward records.
          </li>
        </ul>
      </Section>
      <p className="text-sm text-muted-foreground">
        Boundary and ward records: IEC GIS. Address coordinates: OpenStreetMap
        Nominatim.
      </p>
    </div>
  )
}
