import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Award, CheckCircle2, ClipboardCheck, Lock, Sparkles, Target, UserCheck } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { errorMessage } from '@/lib/errors'
import {
  LEVEL_LABEL,
  QUIZ_PASS,
  enrol,
  itemsDone,
  moduleDone,
  moduleStarted,
  suggestedOrder,
  type MyProgramme,
} from '@/lib/programmeStudent'
import { PageHeader } from '@/components/app/PageHeader'
import { ProgrammeFrame, previewSearch, useMyProgramme } from '@/components/programme/shared'
import { Alert, Badge, Button, buttonClass } from '@/components/ui'

export const Route = createFileRoute('/programmes/$slug/')({
  beforeLoad: requireOnboarded,
  validateSearch: previewSearch,
  component: ProgrammePage,
})

function Overview({ p }: { p: MyProgramme }) {
  const o = p.content.overview
  return (
    <section className="card p-5 sm:p-6">
      {o.audience && <p className="text-sm text-ink-600">For {o.audience.replace(/^for /i, '')}</p>}
      {o.outcomes.length > 0 && (
        <>
          <h2 className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">You will be able to</h2>
          <ul className="mt-2 space-y-1.5">
            {o.outcomes.map((x) => (
              <li key={x} className="flex gap-2 text-sm text-ink-800">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" /> {x}
              </li>
            ))}
          </ul>
        </>
      )}
      <h2 className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">Skills</h2>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {p.content.skills.map((s) => (
          <li key={s.id} className="rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-700" title={s.description}>
            {s.name}
          </li>
        ))}
      </ul>
    </section>
  )
}

function Step({
  n,
  title,
  icon: Icon,
  state,
  children,
}: {
  n: number
  title: string
  icon: typeof Award
  state: 'done' | 'now' | 'locked'
  children: React.ReactNode
}) {
  return (
    <section className={`card p-5 sm:p-6 ${state === 'locked' ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            state === 'done' ? 'bg-emerald-50 text-emerald-600' : state === 'now' ? 'bg-brand-50 text-brand-700' : 'bg-ink-100 text-ink-400'
          }`}
        >
          {state === 'done' ? <CheckCircle2 size={18} /> : state === 'locked' ? <Lock size={16} /> : <Icon size={18} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">Step {n}</p>
          <h2 className="font-display text-lg font-semibold text-ink-900">{title}</h2>
          <div className="mt-2">{children}</div>
        </div>
      </div>
    </section>
  )
}

/** A programme from the student's side: start it, then the steps in order. */
function ProgrammePage() {
  const { slug } = Route.useParams()
  const preview = Boolean(Route.useSearch().preview)
  const { p, error, reload } = useMyProgramme(slug, preview)
  const [busy, setBusy] = useState(false)
  const [startError, setStartError] = useState<string>()
  const search = preview ? { preview: 1 as const } : {}

  return (
    <ProgrammeFrame slug={slug} preview={preview} back="catalogue" p={p} error={error}>
      {(p) => {
        const modules = suggestedOrder(p)
        const done = p.content.modules.filter((m) => moduleDone(p, m)).length
        const allDone = done === p.content.modules.length && p.content.modules.length > 0
        const skillName = (id: string) => p.content.skills.find((s) => s.id === id)?.name ?? ''
        return (
          <div className="space-y-5">
            <PageHeader
              eyebrow={p.kind === 'personal' ? 'Personal programme' : 'Professional programme'}
              title={p.title}
              description={p.content.overview.summary}
              badge={p.final_passed_at ? <Badge tone="success">Final passed</Badge> : undefined}
            />

            {!p.enrolled ? (
              <>
                <Overview p={p} />
                <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
                  <p className="text-sm text-ink-700">
                    {p.content.modules.length} modules
                    {p.content.overview.hours ? ` · about ${p.content.overview.hours} hours` : ''} · free
                  </p>
                  <Button
                    iconRight={ArrowRight}
                    disabled={busy}
                    onClick={() => {
                      setBusy(true)
                      setStartError(undefined)
                      enrol(p.slug)
                        .then(reload)
                        .catch((e) => setStartError(errorMessage(e)))
                        .finally(() => setBusy(false))
                    }}
                  >
                    {busy ? 'Starting…' : 'Start this programme'}
                  </Button>
                  {startError && <p className="w-full text-sm text-red-700">{startError}</p>}
                </div>
              </>
            ) : (
              <>
                {p.latest_version > p.version && (
                  <Alert tone="info" title="You’re on the version you started">
                    <p>A newer version of this programme exists. Your work and results stay on yours.</p>
                  </Alert>
                )}

                <Step n={1} title="Aptitude test" icon={Sparkles} state={p.aptitude ? 'done' : 'now'}>
                  {p.aptitude ? (
                    <>
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {p.content.skills.map((s) => {
                          const sc = p.aptitude!.scores[s.id]
                          if (!sc) return null
                          return (
                            <li key={s.id}>
                              <div className="flex items-baseline justify-between gap-2 text-sm">
                                <span className="text-ink-800">{s.name}</span>
                                <span className="text-xs font-semibold text-ink-600">{LEVEL_LABEL[sc.level]}</span>
                              </div>
                              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100">
                                <div
                                  className={`h-full rounded-full ${sc.level === 'strong' ? 'bg-emerald-500' : sc.level === 'developing' ? 'bg-brand-500' : 'bg-amber-400'}`}
                                  style={{ width: `${Math.max(sc.percent, 4)}%` }}
                                />
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                      <p className="mt-2 text-xs text-ink-500">Your modules below start with the skills you rated lowest.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-ink-600">
                        {p.content.aptitude.items.length} statements about how you work, about 5 minutes. Not a test you can
                        fail: it decides where your modules start.
                      </p>
                      <Link to="/programmes/$slug/aptitude" params={{ slug }} search={search} className={`mt-3 ${buttonClass()}`}>
                        Take the aptitude test <ArrowRight size={16} />
                      </Link>
                    </>
                  )}
                </Step>

                <Step n={2} title={`Modules · ${done} of ${p.content.modules.length} done`} icon={Target} state={allDone ? 'done' : 'now'}>
                  <p className="mb-3 text-sm text-ink-600">
                    Each module: Learn, Practise, Reflect, then a quiz. A module is done when you’ve written every task and the
                    reflection and passed its quiz ({QUIZ_PASS}%).
                  </p>
                  <ol className="divide-y divide-ink-900/[0.06] rounded-xl border border-ink-200">
                    {modules.map((m, i) => {
                      const d = moduleDone(p, m)
                      const q = p.quizzes[m.id]
                      return (
                        <li key={m.id}>
                          <Link
                            to="/programmes/$slug/m/$module"
                            params={{ slug, module: m.id }}
                            search={search}
                            className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-ink-50"
                          >
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                d ? 'bg-emerald-500 text-white' : moduleStarted(p, m) ? 'bg-brand-100 text-brand-800' : 'bg-ink-100 text-ink-600'
                              }`}
                            >
                              {d ? <CheckCircle2 size={14} /> : i + 1}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-ink-900">{m.title}</span>
                              <span className="block truncate text-xs text-ink-500">
                                {skillName(m.skill)} · {m.level} · {m.minutes} min · {itemsDone(p, m)}/{m.tasks.length + 1} written
                                {q ? ` · quiz best ${q.best}%` : ''}
                              </span>
                            </span>
                            <ArrowRight size={15} className="shrink-0 text-ink-400 transition-transform group-hover:translate-x-0.5" />
                          </Link>
                        </li>
                      )
                    })}
                  </ol>
                </Step>

                <Step
                  n={3}
                  title="Final assessment"
                  icon={ClipboardCheck}
                  state={p.final?.passed ? 'done' : allDone || preview ? 'now' : 'locked'}
                >
                  {p.final?.passed ? (
                    <p className="text-sm text-ink-700">
                      Passed with {p.final.percent}% on{' '}
                      {new Date(p.final.completed_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}.
                    </p>
                  ) : allDone || preview ? (
                    <>
                      <p className="text-sm text-ink-600">
                        {p.content.final.questions.length} questions across every skill, {p.content.final.minutes} minutes,{' '}
                        {p.content.final.pass_percent}% to pass.
                        {p.final ? ` Last try: ${p.final.percent}%.` : ''}
                      </p>
                      <Link to="/programmes/$slug/final" params={{ slug }} search={search} className={`mt-3 ${buttonClass()}`}>
                        {p.final ? 'See the final assessment' : 'Take the final assessment'} <ArrowRight size={16} />
                      </Link>
                    </>
                  ) : (
                    <p className="text-sm text-ink-600">Opens once every module is done.</p>
                  )}
                </Step>

                <Step n={4} title="Mentor, project and internship" icon={UserCheck} state="locked">
                  <p className="text-sm text-ink-600">
                    Coming next: work with a mentor on a real project for this programme, then an internship. Finishing it earns
                    the programme’s badge and certificate.
                  </p>
                </Step>
              </>
            )}
          </div>
        )
      }}
    </ProgrammeFrame>
  )
}
