import { useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Award, BarChart3, Check, CheckCircle2, ClipboardCheck, Layers, Lock, Rocket, Sparkles, Target, UserCheck, type LucideIcon } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import {
  LEVEL_LABEL,
  QUIZ_PASS,
  enrol,
  itemsDone,
  itemsToWrite,
  moduleDone,
  suggestedOrder,
  type MyProgramme,
} from '@/lib/programmeStudent'
import type { ProgrammeModule } from '@/lib/programmeEngine'
import { ModuleCard, type ModuleCardStep } from '@/components/lesson/ModuleCard'
import { lessonLook } from '@/components/lesson/LessonFrame'
import { TIERS } from '@/lib/certificates'
import { Alert, buttonClass } from '@/components/ui'

/**
 * A course-engine programme from the student's side (Entrepreneurship, Data Analytics):
 * a header with progress and the journey, then each stage in its own colour. The route
 * (routes/programmes.$slug.index.tsx) fetches the programme and hands it here.
 */

const PROGRAMME_ICON: Record<string, LucideIcon> = {
  'ai-powered-entrepreneurship': Rocket,
  'data-analytics': BarChart3,
}

const section = 'scroll-mt-24 rounded-3xl border border-ink-200 bg-white p-5 shadow-e1 sm:p-7'

function Overview({ p }: { p: MyProgramme }) {
  const o = p.content.overview
  return (
    <section className={section}>
      {o.audience && <p className="text-sm text-ink-600">For {o.audience.replace(/^for /i, '')}</p>}
      {o.outcomes.length > 0 && (
        <>
          <h2 className="mt-3 font-display text-lg font-semibold text-ink-900">You will be able to</h2>
          <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {o.outcomes.map((x) => (
              <li key={x} className="flex gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-snug text-ink-800">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" /> {x}
              </li>
            ))}
          </ul>
        </>
      )}
      <h2 className="mt-6 font-display text-lg font-semibold text-ink-900">Skills you’ll build</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {p.content.skills.map((s) => (
          <li key={s.id} className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700" title={s.description}>
            {s.name}
          </li>
        ))}
      </ul>
    </section>
  )
}

/** A stage of the programme: a coloured band, then what the student does there. */
function Stage({
  id,
  n,
  title,
  kind,
  icon: Icon,
  state,
  children,
}: {
  id: string
  n: number
  title: string
  kind: 'learn' | 'task' | 'quiz' | 'reflect'
  icon: LucideIcon
  state: 'done' | 'now' | 'locked'
  children: ReactNode
}) {
  const look = lessonLook[kind]
  return (
    <section id={id} className={`scroll-mt-24 overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-e1 ${state === 'locked' ? 'opacity-75' : ''}`}>
      <div className={`flex items-center justify-between gap-3 bg-gradient-to-r px-5 py-3 text-white sm:px-7 ${state === 'locked' ? 'from-ink-500 to-ink-600' : look.band}`}>
        <p className="flex items-center gap-2 text-sm font-semibold">
          {state === 'locked' ? <Lock size={16} aria-hidden /> : <Icon size={17} aria-hidden />}
          Step {n} · {title}
        </p>
        {state === 'done' && (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
            <Check size={12} strokeWidth={3} /> Done
          </span>
        )}
      </div>
      <div className="p-5 sm:p-7">{children}</div>
    </section>
  )
}

/** One dot for each step of the module's lesson, ticked when done. */
function stepsOf(p: MyProgramme, m: ProgrammeModule): ModuleCardStep[] {
  const r = p.responses[m.id] ?? {}
  const quiz = p.quizzes[m.id]
  const written = (k: string) => Boolean(r[k])
  return [
    ...(m.learn.length ? [{ label: 'Learn', done: m.tasks[0] ? written(m.tasks[0].id) : Boolean(quiz) }] : []),
    ...m.tasks.map((t, i) => ({ label: `Task ${i + 1}`, done: written(t.id) })),
    ...(m.tasks.length ? [{ label: 'Reflect', done: written('reflect') }] : []),
    ...(m.quiz.length ? [{ label: 'Quiz', done: (quiz?.best ?? 0) >= QUIZ_PASS }] : []),
  ]
}

export function ProgrammeView({
  p,
  slug,
  preview,
  reload,
}: {
  p: MyProgramme
  slug: string
  preview: boolean
  reload: () => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const [startError, setStartError] = useState<string>()
  const search = preview ? { preview: 1 as const } : {}
  const modules = suggestedOrder(p)
  const done = p.content.modules.filter((m) => moduleDone(p, m)).length
  const total = p.content.modules.length
  const allDone = done === total && total > 0
  const percent = total ? Math.round((done / total) * 100) : 0
  const skillName = (id: string) => p.content.skills.find((s) => s.id === id)?.name ?? ''
  const Icon = PROGRAMME_ICON[slug] ?? Layers
  const hasFinal = p.content.final.questions.length > 0
  const finalOpen = p.foundation_unlocked || preview
  const nextModule = modules.find((m) => !moduleDone(p, m))
  const start = () => {
    setBusy(true)
    setStartError(undefined)
    enrol(p.slug)
      .then(reload)
      .catch((e) => setStartError(errorMessage(e)))
      .finally(() => setBusy(false))
  }

  // The journey: aptitude, modules, the Foundation assessment, then what comes next.
  const journey = [
    { id: 'stage-aptitude', label: 'Aptitude', kind: 'learn' as const, icon: Sparkles, done: Boolean(p.aptitude) },
    { id: 'stage-modules', label: 'Modules', kind: 'task' as const, icon: Target, done: allDone },
    ...(hasFinal ? [{ id: 'stage-final', label: 'Assessment', kind: 'quiz' as const, icon: ClipboardCheck, done: Boolean(p.final) }] : []),
    { id: 'stage-next', label: 'Capstone', kind: 'reflect' as const, icon: UserCheck, done: false },
  ]
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="space-y-5">
      {/* The programme's header */}
      <header className="surface-wood-dark relative overflow-hidden rounded-3xl p-5 shadow-e2 sm:p-7">
        <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 opacity-[0.16]">
          <svg width="240" height="240" viewBox="0 0 240 240" fill="none" stroke="#f6e3c8" strokeWidth="2">
            <circle cx="150" cy="90" r="90" />
            <circle cx="150" cy="90" r="68" />
            <circle cx="150" cy="90" r="46" />
            <circle cx="150" cy="90" r="22" />
          </svg>
        </span>
        <div className="relative flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-e1 ring-1 ring-white/20 sm:h-16 sm:w-16">
            <Icon size={28} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
              {p.kind === 'personal' ? 'Personal programme' : 'Professional programme'}
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">{p.title}</h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/75">{p.content.overview.summary}</p>
          </div>
        </div>
        <div className="relative mt-4 flex flex-wrap gap-2 text-xs text-white/80">
          <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">{total} modules</span>
          {p.content.overview.hours ? <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">About {p.content.overview.hours} hours</span> : null}
          <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">Free</span>
          {hasFinal && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-100 ring-1 ring-emerald-300/30">
              <Award size={12} /> {p.final ? 'Foundation certificate earned' : 'Earns a Foundation certificate'}
            </span>
          )}
        </div>

        {p.enrolled ? (
          <>
            <div className="relative mt-5">
              <div className="flex items-center justify-between text-xs text-white/70">
                <span>
                  {done} of {total} modules done
                </span>
                <span className="font-semibold text-white">{percent}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Programme progress">
                <div className="h-full rounded-full bg-gradient-to-r from-brand-200 to-emerald-300 transition-[width] duration-500" style={{ width: `${percent}%` }} />
              </div>
            </div>
            <ol className="relative mt-5 grid" style={{ gridTemplateColumns: `repeat(${journey.length}, minmax(0, 1fr))` }} aria-label="Your journey">
              {journey.map((j, i) => (
                <li key={j.id} className="relative flex flex-col items-center">
                  {i > 0 && <span aria-hidden className={`absolute right-1/2 top-[19px] h-0.5 w-full ${journey[i - 1].done ? 'bg-emerald-400/70' : 'bg-white/15'}`} />}
                  <button type="button" onClick={() => go(j.id)} className="group relative flex flex-col items-center gap-1.5">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full text-white transition-opacity ${j.done ? 'bg-emerald-600' : lessonLook[j.kind].node} ${j.done ? '' : 'opacity-70 group-hover:opacity-100'}`}>
                      {j.done ? <Check size={18} strokeWidth={3} /> : <j.icon size={17} />}
                    </span>
                    <span className="text-[11px] text-white/70">{j.label}</span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="relative mt-5">
              {!p.aptitude ? (
                <Link to="/programmes/$slug/aptitude" params={{ slug }} search={search} className="press inline-flex h-11 items-center gap-1.5 rounded-xl bg-white px-5 text-sm font-semibold text-ink-900 shadow-e1 transition-transform hover:-translate-y-0.5">
                  {done === 0 ? 'Start' : 'Continue'}: Take the aptitude test <ArrowRight size={16} />
                </Link>
              ) : nextModule ? (
                <Link to="/programmes/$slug/m/$module" params={{ slug, module: nextModule.id }} search={search} className="press inline-flex h-11 items-center gap-1.5 rounded-xl bg-white px-5 text-sm font-semibold text-ink-900 shadow-e1 transition-transform hover:-translate-y-0.5">
                  {done === 0 ? 'Start' : 'Continue'}: {nextModule.title} <ArrowRight size={16} />
                </Link>
              ) : hasFinal && !p.final && finalOpen ? (
                <Link to="/programmes/$slug/final" params={{ slug }} search={search} className="press inline-flex h-11 items-center gap-1.5 rounded-xl bg-white px-5 text-sm font-semibold text-ink-900 shadow-e1 transition-transform hover:-translate-y-0.5">
                  Take the Foundation assessment <ArrowRight size={16} />
                </Link>
              ) : null}
            </div>
          </>
        ) : (
          <div className="relative mt-5">
            <button
              type="button"
              disabled={busy}
              onClick={start}
              className="press inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-ink-900 shadow-e2 transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {busy ? 'Starting…' : 'Start this programme'} <ArrowRight size={16} />
            </button>
            {startError && <p className="mt-2 text-sm text-red-300">{startError}</p>}
          </div>
        )}
      </header>

      {!p.enrolled ? (
        <Overview p={p} />
      ) : (
        <>
          {p.latest_version > p.version && (
            <Alert tone="info" title="You’re on the version you started">
              <p>A newer version of this programme exists. Your work and results stay on yours.</p>
            </Alert>
          )}

          <Stage id="stage-aptitude" n={1} title="Aptitude test" kind="learn" icon={Sparkles} state={p.aptitude ? 'done' : 'now'}>
            {p.aptitude ? (
              <>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {p.content.skills.map((s) => {
                    const sc = p.aptitude!.scores[s.id]
                    if (!sc) return null
                    return (
                      <li key={s.id}>
                        <div className="flex items-baseline justify-between gap-2 text-sm">
                          <span className="font-medium text-ink-900">{s.name}</span>
                          <span className="text-xs font-semibold text-ink-600">{LEVEL_LABEL[sc.level]}</span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-200">
                          <div
                            className={`h-full rounded-full ${sc.level === 'strong' ? 'bg-emerald-600' : sc.level === 'developing' ? 'bg-brand-600' : 'bg-amber-600'}`}
                            style={{ width: `${Math.max(sc.percent, 4)}%` }}
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>
                <p className="mt-3 text-xs text-ink-500">Your modules below start with the skills you rated lowest.</p>
              </>
            ) : (
              <>
                <p className="leading-relaxed text-ink-700">
                  {p.content.aptitude.items.length} statements about how you work, about 5 minutes. Not a test you can fail: it decides where your modules start.
                </p>
                <Link to="/programmes/$slug/aptitude" params={{ slug }} search={search} className={`mt-4 ${buttonClass()}`}>
                  Take the aptitude test <ArrowRight size={16} />
                </Link>
              </>
            )}
          </Stage>

          <Stage id="stage-modules" n={2} title={`Modules · ${done} of ${total} done`} kind="task" icon={Target} state={allDone ? 'done' : 'now'}>
            <p className="mb-4 text-sm leading-relaxed text-ink-600">
              Each module is a short lesson: Learn, Practise, Reflect, then a quiz. A module is done when you’ve written what it asks and passed its quiz ({QUIZ_PASS}%) if it has one.
            </p>
            <ol className="grid gap-3 sm:grid-cols-2">
              {modules.map((m, i) => (
                <li key={m.id}>
                  <ModuleCard
                    n={i + 1}
                    title={m.title}
                    blurb={m.summary || m.outcome}
                    meta={`${skillName(m.skill)} · ${m.level}${itemsToWrite(m) ? ` · ${itemsDone(p, m)}/${itemsToWrite(m)} written` : ''}${p.quizzes[m.id] ? ` · quiz best ${p.quizzes[m.id].best}%` : ''}`}
                    minutes={m.minutes}
                    steps={stepsOf(p, m)}
                    link={(cls, inner) => (
                      <Link to="/programmes/$slug/m/$module" params={{ slug, module: m.id }} search={search} className={cls}>
                        {inner}
                      </Link>
                    )}
                  />
                </li>
              ))}
            </ol>
          </Stage>

          {hasFinal && (
            <Stage id="stage-final" n={3} title="Foundation assessment" kind="quiz" icon={ClipboardCheck} state={p.final ? 'done' : finalOpen ? 'now' : 'locked'}>
              {p.final ? (
                <>
                  <p className="leading-relaxed text-ink-700">
                    {TIERS[p.final.kind].certLabel} with {p.final.percent}% on{' '}
                    {new Date(p.final.completed_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}.
                  </p>
                  <Link to="/certificate" search={{ programme: p.slug }} className={`mt-4 ${buttonClass('secondary')}`}>
                    See your Foundation certificate <Award size={16} />
                  </Link>
                </>
              ) : finalOpen ? (
                <>
                  <p className="leading-relaxed text-ink-700">
                    {p.content.final.questions.length} questions on the foundations, {p.content.final.minutes} minutes, taken once. Every finished attempt earns a Foundation certificate: Gold from {TIERS.gold.min}%, Silver from {TIERS.silver.min}%, Bronze below.
                  </p>
                  <Link to="/programmes/$slug/final" params={{ slug }} search={search} className={`mt-4 ${buttonClass()}`}>
                    Take the Foundation assessment <ArrowRight size={16} />
                  </Link>
                </>
              ) : (
                <p className="leading-relaxed text-ink-600">Opens once every foundation module is done. It earns your Foundation certificate.</p>
              )}
            </Stage>
          )}

          <Stage id="stage-next" n={hasFinal ? 4 : 3} title="Practical tasks, capstone and Programme certificate" kind="reflect" icon={UserCheck} state="locked">
            <p className="leading-relaxed text-ink-600">
              Coming next: practical tasks, then a capstone project graded by a mentor, and an internship. Finishing them earns the Programme certificate, your second credential after the Foundation certificate.
            </p>
          </Stage>
        </>
      )}
    </div>
  )
}
