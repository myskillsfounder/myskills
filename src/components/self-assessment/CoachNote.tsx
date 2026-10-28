import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { sessionUser } from '@/lib/sessionUser'

type Test = 'dm-aptitude' | 'gl-aptitude'
type State = { status: 'queued' | 'writing' | 'done' | 'failed'; note: string | null } | null

/**
 * The coach's note above an aptitude result: a few personal sentences written
 * by AI from the student's answers (docs/supabase-coach-notes.sql, agents/lib/
 * coach.mjs). It is written on the server a few seconds after the result is
 * saved, so it is checked again for a couple of minutes; with no note (before
 * the SQL is run, or for a result from before notes existed) nothing shows.
 */
export function CoachNote({ test }: { test: Test }) {
  const [state, setState] = useState<State>(null)

  useEffect(() => {
    let active = true
    let tries = 0
    let timer: number | undefined
    async function load() {
      const user = await sessionUser()
      if (!user || !active) return
      const { data, error } = await supabase
        .from('coach_notes')
        .select('status, note')
        .eq('student_id', user.id)
        .eq('test', test)
        .maybeSingle()
      if (!active || error) return
      setState((data as State) ?? null)
      // Waiting, or not queued yet (the result was saved a moment ago): look again.
      const waiting = !data || data.status === 'queued' || data.status === 'writing'
      if (waiting && ++tries < 24) timer = window.setTimeout(load, 5000)
    }
    void load()
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [test])

  if (!state || state.status === 'failed') return null
  const writing = state.status !== 'done' || !state.note
  return (
    <section className="card-glass-dark mb-5 p-5" aria-live="polite">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-200">
        <Sparkles size={14} /> From your AI coach
      </p>
      {writing ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-white/60">
          <span className="flex gap-1" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/60" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </span>
          Your coach is reading your answers and writing you a note…
        </p>
      ) : (
        <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-white/85">{state.note}</p>
      )}
    </section>
  )
}
