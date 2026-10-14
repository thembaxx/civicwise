import 'server-only'

export type WardResult = {
  wardNumber: string
  municipalityCode?: string
  municipalityName?: string
  province?: string
  label: string
  source: string
  coordinates?: { lat: number; lng: number }
  address?: string
  boundaryAvailable: boolean
}

type NominatimResult = { lat: string; lon: string; display_name: string }
const IEC_BASE = 'https://api.elections.org.za/IECGIS/api'

export async function searchWard(input: { query?: string; lat?: number; lng?: number }): Promise<WardResult[]> {
  const coordinates = input.lat !== undefined && input.lng !== undefined ? { lat: input.lat, lng: input.lng } : undefined
  if (!coordinates && input.query) {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', input.query)
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('limit', '5')
    url.searchParams.set('countrycodes', 'za')
    const response = await fetch(url, { headers: { 'User-Agent': 'CivicLedger/1.0 civic-lookup' }, next: { revalidate: 3600 } })
    if (!response.ok) return []
    const places = (await response.json()) as NominatimResult[]
    return Promise.all(places.map((place) => lookupIec({ lat: Number(place.lat), lng: Number(place.lon), address: place.display_name })))
  }
  if (coordinates) return [await lookupIec({ ...coordinates, address: input.query })]
  return []
}

async function lookupIec(input: { lat: number; lng: number; address?: string }): Promise<WardResult> {
  const url = new URL(`${IEC_BASE}/MunicByYear`)
  url.searchParams.set('year', String(new Date().getFullYear()))
  url.searchParams.set('latitude', String(input.lat))
  url.searchParams.set('longitude', String(input.lng))
  url.searchParams.set('returnGeom', 'false')
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, next: { revalidate: 86400 } })
    if (response.ok) {
      const data = await response.json()
      const row = Array.isArray(data) ? data[0] : data?.data?.[0] ?? data
      const ward = String(row?.WardNo ?? row?.WardNumber ?? row?.wardNo ?? row?.ward ?? '').replace(/^0+/, '')
      if (ward) return { wardNumber: ward, municipalityCode: row.MunicCode, municipalityName: row.MunicName ?? row.MunicipalityName, province: row.Province, label: `Ward ${ward}${row.MunicName ? ` · ${row.MunicName}` : ''}`, source: 'IEC GIS', coordinates: input, address: input.address, boundaryAvailable: true }
    }
  } catch {}
  return { wardNumber: '', label: 'No ward match found', source: 'IEC GIS', coordinates: input, address: input.address, boundaryAvailable: false }
}

export async function getWardDetail(code: string, wardNumber: string) {
  const url = new URL(`${IEC_BASE}/Ward`)
  url.searchParams.set('wardid', `${code}-${wardNumber}`)
  url.searchParams.set('returnGeom', 'false')
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, next: { revalidate: 86400 } })
    if (response.ok) return await response.json()
  } catch {}
  return null
}

export function isValidWardNumber(value: string) {
  return /^\d{1,3}$/.test(value.trim())
}
