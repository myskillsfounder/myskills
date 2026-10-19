import { useEffect, useState } from 'react'
import { Check, CornerDownRight, Pencil, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { errorMessage } from '@/lib/errors'

const MAX = 120

/**
 * A sub-goal under the objective: one line in the student's own words, the
 * concrete step toward it ("Land a digital marketing internship by March").
 * Kept with the account (auth user_metadata.subgoal), like the onboarding
 * answers, so it follows them across devices and needs no table.
 */
export function SubGoal() {
  const [saved, setSaved] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return
      const v = data.user?.user_metadata?.subgoal
      setSaved(typeof v === 'string' && v.trim() ? v.trim() : '')
    })
    return () => {
      active = false
    }
  }, [])

  async function save(value: string) {
    setBusy(true)
    setError(undefined)
    try {
      const clean = value.trim().slice(0, MAX)
      const { error: e } = await supabase.auth.updateUser({ data: { subgoal: clean || null } })
      if (e) throw e
      setSaved(clean)
      setEditing(false)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  // Not known yet: nothing, rather than an empty box that then fills.
  if (saved === null) return null

  if (saved && !editing) {
    return (
      <div className="group mt-3 flex items-start gap-2.5 rounded-xl border border-brand-100 bg-brand-50/60 px-3.5 py-3">
        <CornerDownRight size={15} className="mt-0.5 shrink-0 text-brand-500" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-700">Sub-goal</p>
          <p className="mt-0.5 break-words text-sm leading-snug text-ink-800">{saved}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setDraft(saved)
            setEditing(true)
          }}
          aria-label="Change your sub-goal"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-white hover:text-ink-700"
        >
          <Pencil size={14} />
        </button>
      </div>
    )
  }

  return (
    <form
      className="mt-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (draft.trim()) void save(draft)
      }}
    >
      <label htmlFor="subgoal" className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
        <CornerDownRight size={13} /> {saved ? 'Change your sub-goal' : 'Add a sub-goal'}
      </label>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          id="subgoal"
          type="text"
          value={draft}
          maxLength={MAX}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Land a digital marketing internship by March"
          className="field h-10 min-w-0 flex-1 text-sm"
          autoFocus={editing}
        />
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          aria-label="Save your sub-goal"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:opacity-40"
        >
          <Check size={17} />
        </button>
        {editing && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            aria-label="Cancel"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-400 hover:bg-ink-100 hover:text-ink-700"
          >
            <X size={17} />
          </button>
        )}
      </div>
      {editing && saved && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void save('')}
          className="mt-1.5 text-xs font-medium text-ink-500 hover:text-red-700"
        >
          Remove the sub-goal
        </button>
      )}
      {error && <p className="mt-1.5 text-xs text-red-700">{error}</p>}
    </form>
  )
}
