import { MODULE_LEVELS, type ProgrammeContent, type ProgrammeModule } from '@/lib/programmeEngine'
import { AddButton, Area, ItemTools, NumberField, Select, Text, moved, replaced, useStructureLock } from './fields'
import { QuestionList } from './QuestionList'

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-ink-900/[0.06] pt-4">
      <h3 className="font-display text-base font-semibold text-ink-900">{title}</h3>
      {hint && <p className="text-xs text-ink-500">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}

/** One module: what it trains, Learn, Practise, Reflect and its quiz. */
export function ModuleEditor({
  m,
  skills,
  onChange,
}: {
  m: ProgrammeModule
  skills: ProgrammeContent['skills']
  onChange: (m: ProgrammeModule) => void
}) {
  const set = <K extends keyof ProgrammeModule>(k: K, v: ProgrammeModule[K]) => onChange({ ...m, [k]: v })
  const locked = useStructureLock()
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Text label="Title" value={m.title} onChange={(v) => set('title', v)} />
        <label className="block text-sm font-medium text-ink-800">
          Skill it trains
          <select value={m.skill} onChange={(e) => set('skill', e.target.value)} className="field mt-1">
            <option value="">Pick a skill</option>
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || s.id}
              </option>
            ))}
          </select>
        </label>
        <Select label="Level" value={m.level} options={MODULE_LEVELS} onChange={(v) => set('level', v)} />
        <NumberField label="Minutes" value={m.minutes} onChange={(v) => set('minutes', v)} />
      </div>
      <Text label="Outcome" value={m.outcome} onChange={(v) => set('outcome', v)} hint="One line: what the student can do after this module." />
      <Area label="Summary (optional, shown in lists)" value={m.summary ?? ''} onChange={(v) => set('summary', v)} rows={2} />
      {locked ? (
        <p className="text-xs text-ink-500">Only the parts this module has are shown: its pages have no place for the others.</p>
      ) : (
        <p className="text-xs text-ink-500">Every part below is optional, but a module needs Practise tasks, a quiz, or both.</p>
      )}

      {/* A built-in programme's pages only show the parts each module already has. */}
      {!(locked && m.learn.length === 0) && (
      <Section title="Learn" hint="Short cards, read in order.">
        <ol className="space-y-3">
          {m.learn.map((c, i) => (
            <li key={i} className="rounded-xl border border-ink-200 bg-white p-3">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1 space-y-2">
                  <Text label={`Card ${i + 1} title`} value={c.title} onChange={(v) => set('learn', replaced(m.learn, i, { ...c, title: v }))} />
                  <Area label="Body" value={c.body} onChange={(v) => set('learn', replaced(m.learn, i, { ...c, body: v }))} rows={4} />
                </div>
                <ItemTools index={i} count={m.learn.length} onMove={(to) => set('learn', moved(m.learn, i, to))} onRemove={() => set('learn', m.learn.filter((_, j) => j !== i))} />
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-3">
          <AddButton onClick={() => set('learn', [...m.learn, { title: '', body: '' }])}>Add a card</AddButton>
        </div>
      </Section>
      )}

      {!(locked && m.tasks.length === 0) && (
      <Section title={`Practise · ${m.tasks.length}`} hint="Written tasks. The answers go to the student’s learning journey.">
        <ol className="space-y-3">
          {m.tasks.map((t, i) => (
            <li key={t.id} className="rounded-xl border border-ink-200 bg-white p-3">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1 space-y-2">
                  <Text label={`Task ${i + 1} title`} value={t.title} onChange={(v) => set('tasks', replaced(m.tasks, i, { ...t, title: v }))} />
                  <Area label="What to do" value={t.prompt} onChange={(v) => set('tasks', replaced(m.tasks, i, { ...t, prompt: v }))} rows={3} />
                  <Text label="Hint or example" value={t.hint} onChange={(v) => set('tasks', replaced(m.tasks, i, { ...t, hint: v }))} />
                </div>
                {!locked && (
                  <ItemTools index={i} count={m.tasks.length} onMove={(to) => set('tasks', moved(m.tasks, i, to))} onRemove={() => set('tasks', m.tasks.filter((_, j) => j !== i))} />
                )}
              </div>
            </li>
          ))}
        </ol>
        <div className={`mt-3 ${locked ? 'hidden' : ''}`}>
          <AddButton
            onClick={() => {
              // Task ids stay t1, t2…; a new one takes the next free number.
              const used = new Set(m.tasks.map((t) => t.id))
              let n = 1
              while (used.has(`t${n}`)) n += 1
              set('tasks', [...m.tasks, { id: `t${n}`, title: '', prompt: '', hint: '' }])
            }}
          >
            Add a task
          </AddButton>
        </div>
      </Section>

      )}

      {!(locked && m.tasks.length === 0) && (
      <Section title="Reflect" hint="Needed when the module has Practise tasks.">
        <div className="space-y-2">
          <Area label="Prompt" value={m.reflection.prompt} onChange={(v) => set('reflection', { ...m.reflection, prompt: v })} rows={2} />
          <Text label="Hint" value={m.reflection.hint} onChange={(v) => set('reflection', { ...m.reflection, hint: v })} />
        </div>
      </Section>
      )}

      {!(locked && m.quiz.length === 0) && (
      <Section title={`Quiz · ${m.quiz.length}`} hint="Scenario questions, graded on the server. Optional; at least 3 when there is one.">
        <QuestionList questions={m.quiz} onChange={(q) => set('quiz', q)} />
      </Section>
      )}
    </div>
  )
}
