import { NextResponse } from 'next/server'
import { searchWard } from '@/lib/ward'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim() || undefined
  const lat = Number(searchParams.get('lat'))
  const lng = Number(searchParams.get('lng'))
  if (!query && (!Number.isFinite(lat) || !Number.isFinite(lng))) return NextResponse.json({ results: [] })
  try {
    const results = await searchWard({ query, lat: Number.isFinite(lat) ? lat : undefined, lng: Number.isFinite(lng) ? lng : undefined })
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: 'Ward lookup is temporarily unavailable.' }, { status: 502 })
  }
}
