export function formatRand(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) return '—'
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1e9) return `${sign}R${(abs / 1e9).toFixed(1)}bn`
  if (abs >= 1e6) return `${sign}R${(abs / 1e6).toFixed(0)}m`
  if (abs >= 1e3) return `${sign}R${(abs / 1e3).toFixed(0)}k`
  return `${sign}R${abs.toFixed(0)}`
}

export function formatPercent(value: number | undefined, digits = 0) {
  if (value === undefined || !Number.isFinite(value)) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(digits)}%`
}

export function financialYear(year: number) {
  return `${year - 1}/${String(year).slice(2)}`
}

const dateTime = new Intl.DateTimeFormat('en-ZA', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Africa/Johannesburg',
})

const dateOnly = new Intl.DateTimeFormat('en-ZA', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Africa/Johannesburg',
})

export function formatDateTime(iso: string) {
  return dateTime.format(new Date(iso))
}

export function formatDate(iso: string) {
  return dateOnly.format(new Date(iso))
}

export function daysSince(iso: string, now = Date.now()) {
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 86_400_000))
}
