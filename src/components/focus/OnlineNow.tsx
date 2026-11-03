import type { FocusPresence } from '@/lib/focusRooms'
import { Avatar } from '@/components/ui'

/** One person per student, however many tabs they have the room open in. */
export function uniqueStudents(people: FocusPresence[]): FocusPresence[] {
  const seen = new Set<string>()
  return people.filter((p) => !seen.has(p.user_id) && seen.add(p.user_id))
}

/**
 * Who is studying in a room right now: their faces, overlapped, and how many.
 * `tone` is the surface it sits on: the dark Study rooms banner or a card.
 */
export function OnlineNow({
  people,
  tone = 'card',
  empty = 'No one yet',
  max = 5,
}: {
  people: FocusPresence[] | undefined
  tone?: 'banner' | 'card'
  empty?: string
  max?: number
}) {
  const students = uniqueStudents(people ?? [])
  const text = tone === 'banner' ? 'text-white/80' : 'text-ink-600'
  if (people === undefined) return <span className={`text-xs ${text}`}>Checking who’s here…</span>
  if (students.length === 0) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs ${text}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${tone === 'banner' ? 'bg-white/40' : 'bg-ink-300'}`} /> {empty}
      </span>
    )
  }
  const shown = students.slice(0, max)
  const ring = tone === 'banner' ? 'ring-[#1e1b4b]' : 'ring-white'
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex -space-x-2">
        {shown.map((p) => (
          <span key={p.user_id} title={p.working_on ? `${p.name}: ${p.working_on}` : p.name} className={`rounded-full ring-2 ${ring}`}>
            <Avatar name={p.name} src={p.avatar} size={26} />
          </span>
        ))}
        {students.length > max && (
          <span className={`flex h-[26px] min-w-[26px] items-center justify-center rounded-full bg-ink-200 px-1 text-[10px] font-semibold text-ink-800 ring-2 ${ring}`}>
            +{students.length - max}
          </span>
        )}
      </span>
      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${tone === 'banner' ? 'text-white' : 'text-ink-800'}`}>
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        {students.length} studying now
      </span>
    </span>
  )
}
