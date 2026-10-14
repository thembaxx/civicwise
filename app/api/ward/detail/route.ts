import { NextResponse } from 'next/server'
import { getWardDetail, isValidWardNumber } from '@/lib/ward'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const municipality = searchParams.get('municipality')?.trim().toUpperCase()
  const ward = searchParams.get('ward')?.trim()
  if (!municipality || !ward || !isValidWardNumber(ward)) {
    return NextResponse.json({ error: 'A municipality code and ward number are required.' }, { status: 400 })
  }

  const detail = await getWardDetail(municipality, ward)
  return NextResponse.json({ detail, source: 'IEC GIS' }, { status: detail ? 200 : 404 })
}
