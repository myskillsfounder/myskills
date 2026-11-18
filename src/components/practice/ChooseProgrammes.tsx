import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { BadgeCheck, Check, Loader2, Plus, X } from 'lucide-react'
import { COURSES, type Course } from '@/content/courses'
import { addToWorkbook } from '@/lib/workbook'
import { errorMessage } from '@/lib/errors'

/*
 * Choosing what to study (Paul, 18 Nov 2026: "for a new user he should be
 * able to choose what he wants to study and add it to workbook"). A new
 * student's Workbook starts here, with every open programme; "Add a
 * programme" opens the same list for the ones not added yet. Adding one
 * keeps it (no removing), and its aptitude test is an optional first step.
 */

function ProgrammeOption({ c, onAdded }: { c: Course; onAdded: (id: Course['id']) => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function add() {
    setBusy(true)
    setError('')
    try {
      await addToWorkbook(c.id)
      onAdded(c.id)
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }
  return (
    <li className="card flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-e1 ring-1 ring-white/30 ${c.tile}`}>
          <c.icon size={22} />
        </span>
        <span className="rounded-full bg-ink-900/[0.05] px-2.5 py-1 text-[11px] font-semibold text-ink-600">
          {c.kind === 'personal' ? 'Personal skills' : 'Professional skills'}
        </span>
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold leading-snug text-ink-900">{c.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{c.tagline}</p>
      <p className="mt-3 text-xs text-ink-500">{c.facts.join(' · ')}</p>
      <ul className="mt-3 space-y-1">
        {c.earn.map((e) => (
          <li key={e} className="flex items-center gap-1.5 text-[13px] text-ink-700">
            <BadgeCheck size={14} className="shrink-0 text-brand-600" /> {e}
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-5">
        <button
          type="button"
          disabled={busy}
          onClick={() => void add()}
          className="press inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-brand-700 disabled:opacity-60"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Add to Workbook
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </li>
  )
}

/** The open programmes not in the Workbook yet. */
function available(added: Course['id'][]) {
  return COURSES.filter((c) => c.status === 'open' && !added.includes(c.id))
}

/** A new student's Workbook: nothing added yet, so choose. */
export function ChooseProgrammes({ onAdded }: { onAdded: (id: Course['id']) => void }) {
  return (
    <section aria-labelledby="choose-programmes">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-700">Workbook</p>
      <h1 id="choose-programmes" className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
        What do you want to study?
      </h1>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-600">
        Your Workbook is empty. Add the programmes you want to study: each one gets its own card here, with your progress. You
        can add more any time.
      </p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {available([]).map((c) => (
          <ProgrammeOption key={c.id} c={c} onAdded={onAdded} />
        ))}
      </ul>
    </section>
  )
}

/** "Add a programme": the ones not added yet, in a dialog. */
export function AddProgrammeDialog({
  added,
  onAdded,
  onClose,
}: {
  added: Course['id'][]
  onAdded: (id: Course['id']) => void
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [onClose])
  const left = available(added)
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Add a programme">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink-900/50" />
      <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-ink-100 p-6 shadow-e2 sm:max-w-3xl sm:rounded-3xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-ink-200 hover:text-ink-900"
        >
          <X size={18} />
        </button>
        <h2 className="pr-10 font-display text-xl font-semibold text-ink-900">Add a programme</h2>
        {left.length === 0 ? (
          <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-emerald-700">
            <Check size={15} strokeWidth={3} /> Every programme is in your Workbook.
          </p>
        ) : (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {left.map((c) => (
              <ProgrammeOption
                key={c.id}
                c={c}
                onAdded={(id) => {
                  onAdded(id)
                  onClose()
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </div>,
    document.body,
  )
}
