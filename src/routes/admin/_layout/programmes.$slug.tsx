import { useCallback, useEffect, useState } from 'react'
import { createFileRoute, Link, useBlocker } from '@tanstack/react-router'
import { AlertTriangle, ArrowLeft, CheckCircle2, Download, ExternalLink, Eye, Lock, Rocket, Save, Upload } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import {
  LEVELS,
  archiveProgramme,
  blankModule,
  discardProgrammeDraft,
  fetchProgramme,
  newId,
  publishProgramme,
  saveProgrammeDraft,
  updateProgramme,
  withDefaults,
  type ProgrammeContent,
  type ProgrammeForEditing,
  type ProgrammeKind,
} from '@/lib/programmeEngine'
import { TIERS } from '@/lib/certificates'
import { RequireSection } from '@/components/admin/AdminSectionGate'
import { AddButton, Area, ItemTools, NumberField, Select, StringList, StructureLock, Text, moved, replaced, useStructureLock } from '@/components/admin/programme/fields'
import { AgentsPanel } from '@/components/admin/programme/AgentsPanel'
import { ModuleEditor } from '@/components/admin/programme/ModuleEditor'
import { QuestionList } from '@/components/admin/programme/QuestionList'
import { Alert, Badge, Button, EmptyState, Skeleton } from '@/components/ui'

export const Route = createFileRoute('/admin/_layout/programmes/$slug')({
  // ?tab=agents opens on the Agents tab (from Agents’ work).
  validateSearch: (s: Record<string, unknown>): { tab?: 'agents' } => (s.tab === 'agents' ? { tab: 'agents' } : {}),
  component: () => (
    <RequireSection section="programmes">
      <ProgrammeEditorPage />
    </RequireSection>
  ),
})

type Tab = 'overview' | 'skills' | 'aptitude' | 'modules' | 'final' | 'project' | 'publish' | 'agents'
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'skills', label: 'Skills' },
  { id: 'aptitude', label: 'Aptitude test' },
  { id: 'modules', label: 'Modules' },
  { id: 'final', label: 'Foundation assessment' },
  { id: 'project', label: 'Project' },
  { id: 'publish', label: 'Check & publish' },
  { id: 'agents', label: 'Agents' },
]

/* ---------------------------------------------------------------- tabs */

function OverviewTab({ c, set }: { c: ProgrammeContent; set: (c: ProgrammeContent) => void }) {
  const o = c.overview
  const put = <K extends keyof typeof o>(k: K, v: (typeof o)[K]) => set({ ...c, overview: { ...o, [k]: v } })
  return (
    <div className="space-y-4">
      <Area label="Summary" value={o.summary} onChange={(v) => put('summary', v)} rows={3} placeholder="What the programme is, in two or three sentences" />
      <Text label="Who it’s for" value={o.audience} onChange={(v) => put('audience', v)} placeholder="Students and graduates who want to…" />
      <StringList label="Outcomes" items={o.outcomes} onChange={(v) => put('outcomes', v)} placeholder="Build a dashboard that answers a business question" addLabel="Add an outcome" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Select label="Level" value={o.level} options={LEVELS} onChange={(v) => put('level', v)} />
        <NumberField label="Hours, about" value={o.hours} onChange={(v) => put('hours', v)} />
      </div>
    </div>
  )
}

function SkillsTab({ c, set }: { c: ProgrammeContent; set: (c: ProgrammeContent) => void }) {
  const locked = useStructureLock()
  const used = (id: string) => c.modules.some((m) => m.skill === id) || c.aptitude.items.some((i) => i.skill === id)
  return (
    <div>
      <p className="mb-3 text-sm text-ink-600">
        The skills the programme builds. The aptitude test measures each one, and every module trains one.
      </p>
      <ol className="space-y-3">
        {c.skills.map((s, i) => (
          <li key={s.id} className="rounded-xl border border-ink-200 bg-white p-3">
            <div className="flex items-start gap-2">
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[14rem_minmax(0,1fr)]">
                <Text label="Name" value={s.name} onChange={(v) => set({ ...c, skills: replaced(c.skills, i, { ...s, name: v }) })} />
                <Text label="What it means" value={s.description} onChange={(v) => set({ ...c, skills: replaced(c.skills, i, { ...s, description: v }) })} />
              </div>
              {!locked && (
                <ItemTools
                  index={i}
                  count={c.skills.length}
                  onMove={(to) => set({ ...c, skills: moved(c.skills, i, to) })}
                  onRemove={() => {
                    if (used(s.id) && !window.confirm(`“${s.name || s.id}” is used by modules or aptitude statements. Remove it anyway?`)) return
                    set({ ...c, skills: c.skills.filter((_, j) => j !== i) })
                  }}
                />
              )}
            </div>
            <p className="mt-1 text-[11px] text-ink-400">id: {s.id}</p>
          </li>
        ))}
      </ol>
      {!locked && (
        <div className="mt-3">
          <AddButton onClick={() => set({ ...c, skills: [...c.skills, { id: newId('s'), name: '', description: '' }] })}>Add a skill</AddButton>
        </div>
      )}
    </div>
  )
}

function AptitudeTab({ c, set }: { c: ProgrammeContent; set: (c: ProgrammeContent) => void }) {
  const locked = useStructureLock()
  const items = c.aptitude.items
  const put = (next: typeof items) => set({ ...c, aptitude: { items: next } })
  if (c.skills.length === 0) return <p className="text-sm text-ink-500">Add the skills first.</p>
  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-600">
        Statements students rate Never, Sometimes, Often or Always. At least two per skill; mark a statement “reverse” when
        agreeing with it means the skill is weaker. Students never see which ones are reversed.
      </p>
      {c.skills.map((s) => {
        const mine = items.map((it, i) => ({ it, i })).filter((x) => x.it.skill === s.id)
        return (
          <section key={s.id}>
            <h3 className="font-display text-base font-semibold text-ink-900">
              {s.name || s.id} <span className="text-sm font-normal text-ink-400">· {mine.length}</span>
            </h3>
            <ul className="mt-2 space-y-2">
              {mine.map(({ it, i }) => (
                <li key={it.id} className="flex items-center gap-2">
                  <input value={it.statement} onChange={(e) => put(replaced(items, i, { ...it, statement: e.target.value }))} className="field" placeholder="I check my numbers before I share them." />
                  <label className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-ink-700">
                    <input type="checkbox" checked={it.reverse} onChange={(e) => put(replaced(items, i, { ...it, reverse: e.target.checked }))} className="h-4 w-4 accent-brand-600" />
                    reverse
                  </label>
                  {!locked && <ItemTools index={0} count={1} onMove={() => {}} onRemove={() => put(items.filter((_, j) => j !== i))} />}
                </li>
              ))}
            </ul>
            {!locked && (
              <div className="mt-2">
                <AddButton onClick={() => put([...items, { id: newId('a'), skill: s.id, statement: '', reverse: false }])}>Add a statement</AddButton>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

function ModulesTab({ c, set }: { c: ProgrammeContent; set: (c: ProgrammeContent) => void }) {
  const [open, setOpen] = useState(0)
  const locked = useStructureLock()
  const skillName = (id: string) => c.skills.find((s) => s.id === id)?.name || 'no skill yet'
  const m = c.modules[open]
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <div>
        <ol className="card divide-y divide-ink-900/[0.06] overflow-hidden">
          {c.modules.map((x, i) => (
            <li key={x.id} className={`flex items-center gap-1 pr-1 ${i === open ? 'bg-brand-50' : ''}`}>
              <button type="button" onClick={() => setOpen(i)} className="min-w-0 flex-1 px-3 py-2.5 text-left">
                <span className={`block truncate text-sm font-semibold ${i === open ? 'text-brand-800' : 'text-ink-900'}`}>
                  {i + 1}. {x.title || 'Untitled'}
                </span>
                <span className="block truncate text-xs text-ink-500">
                  {skillName(x.skill)} · {x.tasks.length ? `${x.tasks.length} tasks` : 'no tasks'} · {x.quiz.length} questions
                </span>
              </button>
              {!locked && (
              <ItemTools
                index={i}
                count={c.modules.length}
                onMove={(to) => {
                  set({ ...c, modules: moved(c.modules, i, to) })
                  setOpen(to)
                }}
                onRemove={() => {
                  if (!window.confirm(`Remove the module “${x.title}”?`)) return
                  set({ ...c, modules: c.modules.filter((_, j) => j !== i) })
                  setOpen(Math.max(0, i - 1))
                }}
              />
              )}
            </li>
          ))}
        </ol>
        <div className={`mt-3 ${locked ? 'hidden' : ''}`}>
          <AddButton
            onClick={() => {
              set({ ...c, modules: [...c.modules, blankModule(c.skills[0]?.id ?? '')] })
              setOpen(c.modules.length)
            }}
          >
            Add a module
          </AddButton>
        </div>
      </div>
      {m ? (
        <div className="card p-5">
          <ModuleEditor key={m.id} m={m} skills={c.skills} onChange={(n) => set({ ...c, modules: replaced(c.modules, open, n) })} />
        </div>
      ) : (
        <p className="text-sm text-ink-500">No modules yet.</p>
      )}
    </div>
  )
}

function FinalTab({ c, set }: { c: ProgrammeContent; set: (c: ProgrammeContent) => void }) {
  const f = c.final
  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-600">
        One multiple-choice test on the foundations of every skill. It opens once the modules marked Foundation are done, is
        taken once, and earns the programme’s Foundation certificate: Gold from {TIERS.gold.min}%, Silver from{' '}
        {TIERS.silver.min}%, Bronze below. Keep the questions foundational. Leave it empty for none, or add at least 5 questions.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField label="Time limit, minutes" value={f.minutes} onChange={(v) => set({ ...c, final: { ...f, minutes: v } })} />
      </div>
      <QuestionList questions={f.questions} onChange={(q) => set({ ...c, final: { ...f, questions: q } })} />
    </div>
  )
}

function ProjectTab({ c, set }: { c: ProgrammeContent; set: (c: ProgrammeContent) => void }) {
  const p = c.project
  return (
    <div className="space-y-4">
      <Area label="Brief" value={p.brief} onChange={(v) => set({ ...c, project: { ...p, brief: v } })} rows={5} placeholder="The real-world problem the student solves, for whom, and what good looks like" />
      <StringList label="What they hand in" items={p.deliverables} onChange={(v) => set({ ...c, project: { ...p, deliverables: v } })} placeholder="A one-page dashboard" addLabel="Add a deliverable" />
      <div>
        <p className="text-sm font-medium text-ink-800">Rubric · each criterion is graded 0 to 5 by the mentor</p>
        <ol className="mt-2 space-y-2">
          {p.rubric.map((r, i) => (
            <li key={r.id} className="flex items-start gap-2">
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[12rem_minmax(0,1fr)]">
                <input value={r.name} onChange={(e) => set({ ...c, project: { ...p, rubric: replaced(p.rubric, i, { ...r, name: e.target.value }) } })} className="field" />
                <input value={r.description} onChange={(e) => set({ ...c, project: { ...p, rubric: replaced(p.rubric, i, { ...r, description: e.target.value }) } })} className="field" />
              </div>
              <ItemTools
                index={i}
                count={p.rubric.length}
                onMove={(to) => set({ ...c, project: { ...p, rubric: moved(p.rubric, i, to) } })}
                onRemove={() => set({ ...c, project: { ...p, rubric: p.rubric.filter((_, j) => j !== i) } })}
              />
            </li>
          ))}
        </ol>
        <div className="mt-2">
          <AddButton onClick={() => set({ ...c, project: { ...p, rubric: [...p.rubric, { id: newId('r'), name: '', description: '' }] } })}>Add a criterion</AddButton>
        </div>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------- the page */

function download(name: string, content: ProgrammeContent) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${name}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * The editor for one programme. Everything edits a draft; publishing makes
 * the draft the live version (students keep the version they started on).
 */
function ProgrammeEditorPage() {
  const { slug } = Route.useParams()
  const [p, setP] = useState<ProgrammeForEditing | null | undefined>(undefined)
  const [content, setContent] = useState<ProgrammeContent>()
  const [problems, setProblems] = useState<string[]>([])
  const [dirty, setDirty] = useState(false)
  const [tab, setTab] = useState<Tab>(Route.useSearch().tab ?? 'overview')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [saved, setSaved] = useState<string>()
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<ProgrammeKind>('professional')
  const [note, setNote] = useState('')
  const [importing, setImporting] = useState(false)
  const [json, setJson] = useState('')

  const load = useCallback(async () => {
    try {
      const r = await fetchProgramme(slug)
      setP(r)
      if (r) {
        setContent(r.content)
        setProblems(r.problems)
        setTitle(r.title)
        setKind(r.kind)
        setDirty(false)
      }
    } catch (e) {
      setError(errorMessage(e))
      setP(null)
    }
  }, [slug])
  useEffect(() => {
    void load()
  }, [load])

  // Leaving with unsaved changes asks first.
  useBlocker({ shouldBlockFn: () => dirty && !window.confirm('You have unsaved changes. Leave anyway?') })

  const edit = (c: ProgrammeContent) => {
    setContent(c)
    setDirty(true)
    setSaved(undefined)
  }

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setError(undefined)
    try {
      await fn()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const save = () =>
    run(async () => {
      if (!p || !content) return
      if (title !== p.title || kind !== p.kind) await updateProgramme(p.id, title, kind)
      setProblems(await saveProgrammeDraft(p.id, content))
      setDirty(false)
      setSaved(`Saved at ${new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`)
      await load()
    })

  if (p === undefined) return <Skeleton className="h-96 w-full" />
  if (p === null || !content) {
    return (
      <>
        {error && (
          <Alert tone="danger" title="Couldn’t open this programme">
            <p>{error}</p>
          </Alert>
        )}
        <EmptyState icon={AlertTriangle} title="Programme not found" description="It may have been renamed. Go back to Programmes." />
      </>
    )
  }

  const live = p.versions.find((v) => v.status === 'published')
  const draft = p.versions.find((v) => v.status === 'draft')
  const builtIn = p.source === 'built-in'

  return (
    <>
      <Link to="/admin/programmes" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900">
        <ArrowLeft size={16} /> Programmes
      </Link>

      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setDirty(true)
            }}
            aria-label="Programme name"
            className="w-full bg-transparent font-display text-3xl font-semibold text-ink-900 outline-none focus:underline"
          />
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-600">
            <span>/programmes/{p.slug}</span>
            <select
              value={kind}
              onChange={(e) => {
                setKind(e.target.value as ProgrammeKind)
                setDirty(true)
              }}
              className="rounded-lg border border-ink-200 bg-white px-2 py-0.5 text-xs"
            >
              <option value="professional">Professional</option>
              <option value="personal">Personal</option>
            </select>
            {live ? <Badge tone="success">Live: v{live.version}</Badge> : <Badge tone="brand">Not published yet</Badge>}
            {draft && <Badge tone="warning">Editing draft v{draft.version}</Badge>}
            {p.status === 'archived' && <Badge tone="neutral">Archived</Badge>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {builtIn ? (
            <a
              href={p.slug === 'global-leadership' ? '/career-readiness' : '/practice'}
              target="_blank"
              rel="noreferrer"
              title="The pages students use. They show the published version."
              className="inline-flex items-center gap-1.5 rounded-xl border border-ink-300 bg-white px-3 py-2 text-sm font-medium text-ink-800 hover:bg-ink-100"
            >
              <ExternalLink size={15} /> Open the live pages
            </a>
          ) : (
            <a
              href={`/programmes/${p.slug}?preview=1`}
              target="_blank"
              rel="noreferrer"
              title="Opens in a new tab. Shows the saved draft, so save first."
              className="inline-flex items-center gap-1.5 rounded-xl border border-ink-300 bg-white px-3 py-2 text-sm font-medium text-ink-800 hover:bg-ink-100"
            >
              <Eye size={15} /> Preview as a student
            </a>
          )}
          {saved && !dirty && <span className="text-xs text-emerald-700">{saved}</span>}
          {dirty && <span className="text-xs font-semibold text-amber-700">Unsaved changes</span>}
          <Button icon={Save} disabled={busy || !dirty} onClick={() => void save()}>
            {busy ? 'Saving…' : 'Save draft'}
          </Button>
        </div>
      </header>

      {error && (
        <div className="mb-4">
          <Alert tone="danger" title="Couldn’t do that">
            <p>{error}</p>
          </Alert>
        </div>
      )}

      {builtIn && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 p-3.5 text-sm text-ink-800">
          <Lock size={16} className="mt-0.5 shrink-0 text-brand-700" />
          <p>
            <span className="font-semibold">Built into the app.</span> Publishing changes what students see on its own pages.
            You can reword anything, and change questions, options, answers and explanations. Modules, tasks, questions,
            statements and skills can’t be added, removed or reordered yet, because students’ progress and the Global
            Readiness Score count them.
            {p.slug === 'global-leadership' && ' The Foundation assessment is the exception: nothing counts its questions, so add them freely.'}
          </p>
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-1.5 border-b border-ink-200 pb-2" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${tab === t.id ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100'}`}
          >
            {t.label}
            {t.id === 'publish' && problems.length > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[11px] font-bold text-white">{problems.length}</span>
            )}
            {t.id === 'modules' && <span className="ml-1 opacity-60">{content.modules.length}</span>}
          </button>
        ))}
      </div>

      <StructureLock.Provider value={builtIn}>
      <div className={tab === 'modules' ? '' : 'card p-5 sm:p-6'}>
        {tab === 'overview' && <OverviewTab c={content} set={edit} />}
        {tab === 'skills' && <SkillsTab c={content} set={edit} />}
        {tab === 'aptitude' && <AptitudeTab c={content} set={edit} />}
        {tab === 'modules' && <ModulesTab c={content} set={edit} />}
        {tab === 'final' && (
          // Global Leadership's Foundation questions are outside its lock:
          // nothing counts them (docs/supabase-foundation-certificates.sql).
          <StructureLock.Provider value={builtIn && p.slug !== 'global-leadership'}>
            <FinalTab c={content} set={edit} />
          </StructureLock.Provider>
        )}
        {tab === 'project' && <ProjectTab c={content} set={edit} />}
        {tab === 'agents' && (
          <AgentsPanel programmeId={p.id} builtIn={builtIn} hasModules={content.modules.length > 0} dirty={dirty} onLoad={edit} />
        )}
        {tab === 'publish' && (
          <div className="space-y-6">
            <section>
              <h2 className="font-display text-lg font-semibold text-ink-900">Before it can be published</h2>
              {dirty && <p className="mt-1 text-sm text-amber-700">Save the draft to check your latest changes.</p>}
              {problems.length === 0 ? (
                <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 size={16} /> Everything is in place.
                </p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {problems.map((x) => (
                    <li key={x} className="flex gap-2 text-sm text-ink-800">
                      <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" /> {x}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="border-t border-ink-900/[0.06] pt-5">
              <h2 className="font-display text-lg font-semibold text-ink-900">Publish</h2>
              <p className="mt-1 text-sm text-ink-600">
                Makes this draft the live version{live ? `, replacing v${live.version}` : ''}. Students who already started
                keep the version they began; nothing they have done changes. New programmes earn a completion badge and
                certificate, not Global Readiness points, until the scoring for several programmes is decided.
              </p>
              <div className="mt-3 max-w-xl space-y-3">
                <Text label="What changed (optional, for the version history)" value={note} onChange={setNote} />
                <Button
                  icon={Rocket}
                  disabled={busy || dirty || problems.length > 0 || !draft}
                  onClick={() =>
                    void run(async () => {
                      if (!window.confirm(`Publish ${p.title} v${draft?.version}?`)) return
                      await publishProgramme(p.id, note)
                      setNote('')
                      await load()
                    })
                  }
                >
                  {draft ? `Publish v${draft.version}` : 'Nothing to publish'}
                </Button>
                {!draft && <p className="text-xs text-ink-500">Change anything and save to start the next draft.</p>}
              </div>
            </section>

            <section className="border-t border-ink-900/[0.06] pt-5">
              <h2 className="font-display text-lg font-semibold text-ink-900">Versions</h2>
              <ul className="mt-2 divide-y divide-ink-100 text-sm">
                {p.versions.map((v) => (
                  <li key={v.version} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                    <span>
                      <span className="font-semibold text-ink-900">v{v.version}</span>{' '}
                      <span className="text-ink-600">
                        · {v.status === 'published' ? 'live' : v.status === 'draft' ? 'draft' : 'earlier'}
                        {v.note ? ` · ${v.note}` : ''}
                      </span>
                    </span>
                    <span className="text-xs text-ink-500">
                      {new Date(v.published_at ?? v.updated_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="border-t border-ink-900/[0.06] pt-5">
              <h2 className="font-display text-lg font-semibold text-ink-900">The whole programme as a file</h2>
              <p className="mt-1 text-sm text-ink-600">
                Download it to keep or share, or replace the draft with a file, for example one drafted by the Course
                Architect.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="secondary" icon={Download} onClick={() => download(`${p.slug}-v${p.editing_version}`, content)}>
                  Download
                </Button>
                <Button variant="secondary" icon={Upload} onClick={() => setImporting((x) => !x)}>
                  Replace the draft…
                </Button>
                {draft && live && (
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        if (!window.confirm(`Throw away draft v${draft.version} and go back to the live v${live.version}?`)) return
                        await discardProgrammeDraft(p.id)
                        await load()
                      })
                    }
                  >
                    Discard the draft
                  </Button>
                )}
                {!builtIn && (
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        await archiveProgramme(p.id, p.status !== 'archived')
                        await load()
                      })
                    }
                  >
                    {p.status === 'archived' ? 'Bring back' : 'Archive'}
                  </Button>
                )}
              </div>
              {importing && (
                <div className="mt-3 space-y-2">
                  <textarea value={json} onChange={(e) => setJson(e.target.value)} rows={8} className="field font-mono text-xs" placeholder='{"overview": {...}, "skills": [...], ...}' />
                  <Button
                    variant="secondary"
                    disabled={!json.trim()}
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(json) as Partial<ProgrammeContent>
                        if (!window.confirm('Replace everything in the draft with this file? (Nothing is saved until you press Save draft.)')) return
                        edit(withDefaults(parsed))
                        setImporting(false)
                        setJson('')
                        setTab('overview')
                      } catch {
                        setError('That isn’t valid JSON.')
                      }
                    }}
                  >
                    Use this file
                  </Button>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
      </StructureLock.Provider>
    </>
  )
}
