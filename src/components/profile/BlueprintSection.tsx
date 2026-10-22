import { useState } from 'react'
import { CheckSquare, Eye, Flag, Gem, Leaf, Pencil, Plus, Square, Target, Trash2, type LucideIcon } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { blueprintStarted, type Blueprint, type BlueprintGoal } from '@/lib/personalBlueprint'
import { Modal, PrimaryButton, Textarea } from './ui'

const PROMPTS = {
  vision: { title: 'Vision', icon: Eye, tile: 'bg-violet-100 text-violet-600', hint: 'Who you want to become, in 5 to 10 years.', example: 'Become a nurse leader known for kind, expert care.' },
  mission: { title: 'Mission', icon: Target, tile: 'bg-sky-100 text-sky-600', hint: 'What you do, every day, to get there.', example: 'Keep learning, practise every week and help the people around me.' },
  purpose: { title: 'Purpose', icon: Leaf, tile: 'bg-emerald-100 text-emerald-600', hint: 'Why it matters to you.', example: 'Make healthcare better for families like mine.' },
} as const

function Tile({ icon: Icon, tile, title, children }: { icon: LucideIcon; tile: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-ink-900/[0.08] bg-white p-4">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tile}`}>
        <Icon size={19} />
      </span>
      <h3 className="mt-3 font-display text-base font-semibold text-ink-900">{title}</h3>
      <div className="mt-1.5 text-sm leading-relaxed text-ink-700">{children}</div>
    </div>
  )
}

const newGoal = (): BlueprintGoal => ({ id: Math.random().toString(36).slice(2, 9), text: '', done: false })

/** Write or change the blueprint. */
function Editor({ start, onSave, onClose }: { start: Blueprint; onSave: (b: Blueprint) => Promise<void>; onClose: () => void }) {
  const [b, setB] = useState<Blueprint>({ ...start, goals: start.goals.length ? start.goals : [newGoal()] })
  const [values, setValues] = useState(start.core_values.join(', '))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  async function save() {
    setBusy(true)
    setError(undefined)
    try {
      await onSave({ ...b, core_values: values.split(',').map((v) => v.trim()).filter(Boolean) })
      onClose()
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }

  return (
    <Modal open title="Your personal blueprint" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-ink-600">The foundation for your decisions. Write it in your own words; you can change it any time. Only you can see it.</p>
        {(Object.keys(PROMPTS) as (keyof typeof PROMPTS)[]).map((k) => (
          <Textarea
            key={k}
            label={`${PROMPTS[k].title}: ${PROMPTS[k].hint}`}
            value={b[k]}
            onChange={(e) => setB({ ...b, [k]: e.target.value })}
            rows={2}
            maxLength={400}
            placeholder={PROMPTS[k].example}
          />
        ))}
        <div>
          <label className="block text-sm font-medium text-ink-800">
            Values: up to 7, separated by commas
            <input
              value={values}
              onChange={(e) => setValues(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-ink-300 bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              placeholder="Integrity, Lifelong learning, Excellence, Empathy"
            />
          </label>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink-800">Goals for</p>
            <input
              type="number"
              value={b.goals_year}
              min={2020}
              max={2100}
              onChange={(e) => setB({ ...b, goals_year: Number(e.target.value) || new Date().getFullYear() })}
              className="w-24 rounded-lg border border-ink-300 px-2 py-1 text-sm"
              aria-label="Year"
            />
          </div>
          <ul className="mt-2 space-y-2">
            {b.goals.map((g, i) => (
              <li key={g.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={g.done}
                  onChange={(e) => setB({ ...b, goals: b.goals.map((x, j) => (j === i ? { ...x, done: e.target.checked } : x)) })}
                  className="h-4 w-4 accent-brand-600"
                  aria-label="Done"
                />
                <input
                  value={g.text}
                  onChange={(e) => setB({ ...b, goals: b.goals.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })}
                  maxLength={120}
                  className="min-w-0 flex-1 rounded-lg border border-ink-300 px-3 py-2 text-sm"
                  placeholder="Reach Italian B1"
                />
                <button type="button" onClick={() => setB({ ...b, goals: b.goals.filter((_, j) => j !== i) })} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-800" aria-label="Remove goal">
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
          {b.goals.length < 10 && (
            <button type="button" onClick={() => setB({ ...b, goals: [...b.goals, newGoal()] })} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-700">
              <Plus size={15} /> Add a goal
            </button>
          )}
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="flex justify-end">
          <PrimaryButton disabled={busy} onClick={() => void save()}>
            {busy ? 'Saving…' : 'Save my blueprint'}
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  )
}

/** Vision, mission, purpose, values and goals: the student's own, on their profile. */
export function BlueprintSection({ blueprint, save }: { blueprint: Blueprint; save: (b: Blueprint) => Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const started = blueprintStarted(blueprint)
  const empty = (k: keyof typeof PROMPTS) => <span className="text-ink-400">{PROMPTS[k].hint}</span>

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">Personal blueprint</h2>
          <p className="text-sm text-ink-500">The foundation that drives my decisions and actions.</p>
        </div>
        <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
          {started ? 'Update blueprint' : 'Write my blueprint'} <Pencil size={14} />
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {(Object.keys(PROMPTS) as (keyof typeof PROMPTS)[]).map((k) => (
          <Tile key={k} icon={PROMPTS[k].icon} tile={PROMPTS[k].tile} title={PROMPTS[k].title}>
            {blueprint[k] ? <p>{blueprint[k]}</p> : empty(k)}
          </Tile>
        ))}
        <Tile icon={Gem} tile="bg-orange-100 text-orange-600" title="Values">
          {blueprint.core_values.length ? (
            <ul className="list-disc space-y-1 pl-4">
              {blueprint.core_values.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          ) : (
            <span className="text-ink-400">What you stand for, in a word or two each.</span>
          )}
        </Tile>
        <Tile icon={Flag} tile="bg-pink-100 text-pink-600" title="Goals">
          {blueprint.goals.length ? (
            <>
              <p className="text-xs font-semibold text-ink-900">{blueprint.goals_year} goals</p>
              <ul className="mt-1.5 space-y-1.5">
                {blueprint.goals.map((g) => (
                  <li key={g.id} className="flex items-start gap-1.5">
                    {g.done ? <CheckSquare size={15} className="mt-0.5 shrink-0 text-emerald-600" /> : <Square size={15} className="mt-0.5 shrink-0 text-ink-300" />}
                    <span className={g.done ? 'text-ink-800' : 'text-ink-600'}>{g.text}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <span className="text-ink-400">What you want to achieve this year.</span>
          )}
        </Tile>
      </div>

      {editing && <Editor start={blueprint} onSave={save} onClose={() => setEditing(false)} />}
    </section>
  )
}
