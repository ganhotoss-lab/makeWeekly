export function getWeekStartDate(date: Date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export function getPrevWeekStartDate(weekStart: string): string {
  const d = new Date(weekStart)
  d.setDate(d.getDate() - 7)
  return d.toISOString().split('T')[0]
}

export function getWeekLabel(weekStartDate: string): string {
  const start = new Date(weekStartDate)
  const end = new Date(weekStartDate)
  end.setDate(end.getDate() + 4)
  const fmt = (d: Date) =>
    `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
  return `${fmt(start)}~${fmt(end)}`
}
