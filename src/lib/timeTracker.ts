/**
 * Lightweight, device-local time tracking. While the app tab is visible we add
 * a few seconds every tick to the current hour's bucket in localStorage. The
 * dashboard aggregates these into the "Time spent" chart. No server storage —
 * this is a personal, per-device metric.
 */
const KEY = 'myskills.timeSpent'
const TICK_SECONDS = 15

type Buckets = Record<string, number> // key: "YYYY-MM-DD HH" -> seconds

function read(): Buckets {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as Buckets
  } catch {
    return {}
  }
}
function write(b: Buckets) {
  try {
    localStorage.setItem(KEY, JSON.stringify(b))
  } catch {
    /* ignore */
  }
}

const pad = (n: number) => String(n).padStart(2, '0')
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const hourKey = (d: Date) => `${dayKey(d)} ${pad(d.getHours())}`

export function recordActiveSeconds(sec: number) {
  const b = read()
  const k = hourKey(new Date())
  b[k] = (b[k] || 0) + sec
  write(b)
}

/** Start ticking while the tab is visible. Call once at app root. */
export function startTimeTracking(): () => void {
  const id = window.setInterval(() => {
    if (document.visibilityState === 'visible') recordActiveSeconds(TICK_SECONDS)
  }, TICK_SECONDS * 1000)
  return () => window.clearInterval(id)
}

export type Period = 'day' | 'month' | 'year' | 'max'
export interface Point {
  label: string
  value: number // hours
}

const WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function sumWhere(b: Buckets, prefix: string): number {
  let s = 0
  for (const k in b) if (k.startsWith(prefix)) s += b[k]
  return s
}

export function timeSeries(period: Period): { points: Point[]; totalHours: number } {
  const b = read()
  const now = new Date()
  const points: Point[] = []

  if (period === 'day') {
    const day = dayKey(now)
    for (let h = 0; h < 24; h++) {
      points.push({ label: `${h}`, value: (b[`${day} ${pad(h)}`] || 0) / 3600 })
    }
  } else if (period === 'month') {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      points.push({ label: WD[d.getDay()], value: sumWhere(b, dayKey(d)) / 3600 })
    }
  } else if (period === 'year') {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      points.push({ label: MO[d.getMonth()], value: sumWhere(b, `${d.getFullYear()}-${pad(d.getMonth() + 1)}`) / 3600 })
    }
  } else {
    const days = new Set<string>()
    for (const k in b) days.add(k.slice(0, 10))
    const sorted = [...days].sort()
    if (sorted.length === 0) sorted.push(dayKey(now))
    for (const day of sorted) points.push({ label: day.slice(5), value: sumWhere(b, day) / 3600 })
  }

  const totalHours = points.reduce((s, p) => s + p.value, 0)
  return { points, totalHours }
}
