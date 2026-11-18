// Helpers for Philippine time (Asia/Manila, UTC+8)

export function todayManila(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }) // YYYY-MM-DD
}

export function dayRange(date: string): [string, string] {
  return [`${date}T00:00:00+08:00`, `${date}T23:59:59.999+08:00`]
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00+08:00`)
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
}

export function peso(n: number | string | null | undefined): string {
  const v = Number(n || 0)
  return '₱' + v.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' })
}
