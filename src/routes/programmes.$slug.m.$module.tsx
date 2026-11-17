import { useState, type ReactNode } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, BarChart3, CheckCircle2, Layers, Rocket, type LucideIcon } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import {
  MIN_REFLECTION,
  MIN_TASK,
  QUIZ_PASS,
  gradeLocally,
  moduleDone,
  saveResponse,
  submitQuiz,
  suggestedOrder,
  type MyProgramme,
} from '@/lib/programmeStudent'
import type { ProgrammeModule } from '@/lib/programmeEngine'
import { ProgrammeFrame, previewSearch, useMyProgramme } from '@/components/programme/shared'
import { LessonFrame, LessonLearn, LessonQuiz, LessonWrite, type LessonStep } from '@/components/lesson/LessonFrame'
import { Alert } from '@/components/ui'

export const Route = createFileRoute('/programmes/$slug/m/$module')({
  beforeLoad: requireOnboarded,
  validateSearch: previewSearch,
  component: ModulePage,
})

type Step = 'learn' | 'reflect' | 'quiz' | string

const PROGRAMME_ICON: Record<string, LucideIcon> = {
  'ai-powered-entrepreneurship': Rocket,
  'data-analytics': BarChart3,
}

function ModuleView({
  p,
  m,
  preview,
  reload,
  eyebrow,
  subtitle,
  icon,
}: {
  p: MyProgramme
  m: ProgrammeModule
  preview: boolean
  reload: () => Promise<void>
  eyebrow: string
  subtitle: ReactNode
  icon: LucideIcon
}) {
  const { slug } = Route.useParams()
  const responses = p.responses[m.id] ?? {}
  const [local, setLocal] = useState<Record<string, string>>({})
  const written = (k: string) => Boolean(local[k] ?? responses[k])
  // Only the parts this module has.
  const stepList: { key: Step; label: string; kind: LessonStep['kind'] }[] = [
    ...(m.learn.length ? [{ key: 'learn', label: 'Learn', kind: 'learn' as const }] : []),
    ...m.tasks.map((t, i) => ({ key: t.id, label: `Task ${i + 1}`, kind: 'task' as const })),
    ...(m.tasks.length ? [{ key: 'reflect', label: 'Reflect', kind: 'reflect' as const }] : []),
    ...(m.quiz.length ? [{ key: 'quiz', label: 'Quiz', kind: 'quiz' as const }] : []),
  ]
  // Where to open: Learn on a first visit, then the first thing not yet
  // written, then the quiz once everything is written.
  const [step, setStep] = useState<Step>(() => {
    if (Object.keys(responses).length === 0) return stepList[0]?.key ?? 'learn'
    return stepList.find((s) => s.key !== 'learn' && s.key !== 'quiz' && !responses[s.key])?.key ?? stepList[stepList.length - 1]?.key ?? 'learn'
  })
  const idx = stepList.findIndex((s) => s.key === step)
  const next = () => setStep(stepList[Math.min(idx + 1, stepList.length - 1)].key)
  const quiz = p.quizzes[m.id]
  // Just taken: keep the review on screen, even though a retake is now a day away.
  const [taken, setTaken] = useState(false)
  const locked = !preview && !taken && quiz && new Date(quiz.next_at) > new Date()
  const done = moduleDone(p, m)
  const order = suggestedOrder(p)
  const after = order[order.findIndex((x) => x.id === m.id) + 1]
  const search = preview ? { preview: 1 as const } : {}

  const save = async (item: string, text: string) => {
    if (!preview) await saveResponse(slug, m.id, item, text)
    setLocal((l) => ({ ...l, [item]: text }))
    if (!preview) void reload()
  }

  const steps: LessonStep[] = stepList.map((s, i) => ({
    key: s.key,
    label: s.label,
    kind: s.kind,
    done:
      s.key === 'learn'
        ? i < idx || (m.tasks[0] ? written(m.tasks[0].id) : Boolean(quiz))
        : s.key === 'quiz'
          ? (quiz?.best ?? 0) >= QUIZ_PASS
          : written(s.key),
  }))

  const banner = done ? (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
        <CheckCircle2 size={16} /> Module done
      </p>
      {after ? (
        <Link to="/programmes/$slug/m/$module" params={{ slug, module: after.id }} search={search} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-emerald-900 hover:underline">
          Next: {after.title} <ArrowRight size={14} />
        </Link>
      ) : (
        <Link to="/programmes/$slug" params={{ slug }} search={search} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-emerald-900 hover:underline">
          Back to the programme <ArrowRight size={14} />
        </Link>
      )}
    </div>
  ) : null

  return (
    <LessonFrame icon={icon} eyebrow={eyebrow} title={m.title} subtitle={subtitle} steps={steps} active={step} onSelect={setStep} banner={banner}>
      {step === 'learn' && (
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">Read this first</p>
          <LessonLearn cards={m.learn} />
        </div>
      )}

      {m.tasks.map(
        (t) =>
          step === t.id && (
            <LessonWrite key={t.id} kind="task" title={t.title} prompt={t.prompt} hint={t.hint} min={MIN_TASK} initial={local[t.id] ?? responses[t.id] ?? ''} onSave={(x) => save(t.id, x)} onNext={next} />
          ),
      )}

      {step === 'reflect' && (
        <LessonWrite
          kind="reflect"
          title="Reflect"
          prompt={m.reflection.prompt}
          hint={m.reflection.hint}
          min={MIN_REFLECTION}
          initial={local.reflect ?? responses.reflect ?? ''}
          onSave={(x) => save('reflect', x)}
          onNext={next}
          last={!m.quiz.length}
        />
      )}

      {step === 'quiz' &&
        (locked ? (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
            <p className="font-display text-lg font-semibold text-ink-900">Quiz best: {quiz!.best}%</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-700">
              {quiz!.best >= QUIZ_PASS ? 'Passed. ' : ''}You can take it again after{' '}
              {new Date(quiz!.next_at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}: a retake straight
              after seeing the answers would test memory, not the skill.
            </p>
          </div>
        ) : (
          <div>
            <h2 className="font-display text-xl font-semibold text-ink-900 sm:text-2xl">Check what you’ve learned</h2>
            {quiz && !taken && (
              <p className="mt-1 text-sm text-ink-600">
                Best so far: {quiz.best}% after {quiz.attempts} {quiz.attempts === 1 ? 'try' : 'tries'}. {QUIZ_PASS}% passes.
              </p>
            )}
            <div className="mt-4">
              <LessonQuiz
                key={`quiz-${m.id}`}
                questions={m.quiz}
                passPercent={QUIZ_PASS}
                onSubmit={async (answers) => {
                  if (preview) return gradeLocally(m.quiz, answers)
                  const r = await submitQuiz(slug, m.id, answers)
                  setTaken(true)
                  void reload()
                  return r
                }}
              />
            </div>
          </div>
        ))}
    </LessonFrame>
  )
}

/** One module: Learn, each Practise task, Reflect, then the quiz, as an interactive lesson. */
function ModulePage() {
  const { slug, module } = Route.useParams()
  const preview = Boolean(Route.useSearch().preview)
  const { p, error, reload } = useMyProgramme(slug, preview)
  return (
    <ProgrammeFrame slug={slug} preview={preview} back="programme" p={p} error={error}>
      {(p) => {
        const m = p.content.modules.find((x) => x.id === module)
        if (!m) return <p className="text-sm text-ink-600">We couldn’t find that module.</p>
        if (!p.enrolled) {
          return (
            <Alert tone="info" title="Start the programme first">
              <p>
                Open{' '}
                <Link to="/programmes/$slug" params={{ slug }} className="font-semibold underline">
                  {p.title}
                </Link>{' '}
                and press “Start this programme”.
              </p>
            </Alert>
          )
        }
        const skill = p.content.skills.find((s) => s.id === m.skill)?.name
        const position = p.content.modules.findIndex((x) => x.id === m.id)
        return (
          <ModuleView
            key={m.id}
            p={p}
            m={m}
            preview={preview}
            reload={reload}
            icon={PROGRAMME_ICON[slug] ?? Layers}
            eyebrow={`${p.title} · Module ${position + 1} of ${p.content.modules.length}${skill ? ` · ${skill}` : ''} · ${m.level}`}
            subtitle={
              <>
                {m.outcome}
                <span className="mt-1 block text-xs text-white/60">About {m.minutes} minutes</span>
              </>
            }
          />
        )
      }}
    </ProgrammeFrame>
  )
}
