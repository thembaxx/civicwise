'use client'

import useSWR from 'swr'
import type { Report } from './reports'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Request failed')
  return res.json()
}

export function useReports(code: string) {
  const { data, error, isLoading, mutate } = useSWR<{ reports: Report[] }>(`/api/reports?m=${code}`, fetcher)
  return { reports: data?.reports ?? [], error, isLoading, mutate }
}

export function useReport(id: string, fallback?: Report) {
  const { data, error, mutate } = useSWR<{ report: Report }>(`/api/reports/${id}`, fetcher, {
    fallbackData: fallback ? { report: fallback } : undefined,
  })
  return { report: data?.report, error, mutate }
}

export async function postAction(id: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/reports/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Action failed')
  return (await res.json()) as { report: Report }
}
