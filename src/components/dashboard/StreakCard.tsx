import { useEffect, useState } from 'react'
import { Flame } from 'lucide-react'

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Daily visit streak, tracked in localStorage (per device). */
export function StreakCard({ userKey }: { userKey: string }) {
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    const KEY = `myskills.streak.${userKey}`
    let data: { last: string; count: number }
    try {
      data = JSON.parse(localStorage.getItem(KEY) || 'null') || { last: '', count: 0 }
    } catch {
      data = { last: '', count: 0 }
    }
    const today = dayKey(new Date())
    const yesterday = dayKey(new Date(Date.now() - 86400000))
    if (data.last === today) {
      // already counted today
    } else if (data.last === yesterday) {
      data = { last: today, count: data.count + 1 }
    } else {
      data = { last: today, count: 1 }
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(data))
    } catch {
      /* ignore */
    }
    setStreak(data.count)
  }, [userKey])

  return (
    <div className="rounded-2xl border border-orange-200 bg-orange-50 p-3 sm:p-4">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-orange-500 sm:h-9 sm:w-9 sm:rounded-xl">
        <Flame size={16} />
      </span>
      <p className="mt-2 text-lg font-semibold tracking-tight text-ink-900 sm:mt-3 sm:text-2xl">
        {streak} <span className="text-xs font-normal text-ink-400 sm:text-sm">day{streak === 1 ? '' : 's'}</span>
      </p>
      <p className="text-[11px] font-semibold text-orange-700 sm:text-xs">Daily streak</p>
      <p className="hidden text-[11px] text-ink-500 sm:block">keep it going</p>
    </div>
  )
}
