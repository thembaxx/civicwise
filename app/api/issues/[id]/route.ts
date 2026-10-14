import { NextResponse, type NextRequest } from 'next/server'
import type { IssueAction } from '@/lib/issues'
import { applyAction, getIssue } from '@/lib/issues-store'
import { getViewerId } from '@/lib/viewer'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const issue = getIssue(await getViewerId(), id)
  if (!issue) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(issue)
}

function parseAction(body: Record<string, unknown> | null): IssueAction | null {
  if (!body) return null
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 280) || undefined : undefined
  switch (body.type) {
    case 'confirm':
      return { type: 'confirm' }
    case 'still_unresolved':
    case 'reported_to_municipality':
    case 'resident_reports_fixed':
      return { type: body.type, note }
    case 'municipal_reference': {
      const reference = typeof body.reference === 'string' ? body.reference.trim().slice(0, 40) : ''
      return /^[\w\-/ ]{3,40}$/.test(reference) ? { type: 'municipal_reference', reference } : null
    }
    case 'reminder': {
      const days = Number(body.days)
      return [3, 7, 14, 30].includes(days) ? { type: 'reminder', days } : null
    }
    default:
      return null
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const action = parseAction(await request.json().catch(() => null))
  if (!action) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  const issue = applyAction(await getViewerId(), id, action)
  if (!issue) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(issue)
}
