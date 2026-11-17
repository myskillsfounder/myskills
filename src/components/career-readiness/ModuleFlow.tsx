import { useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, CheckCircle2, Globe2 } from 'lucide-react'
import {
  MAX_RESPONSE_CHARS,
  MIN_REFLECTION_CHARS,
  MIN_TASK_CHARS,
  type ItemKey,
  type ModuleContent,
} from '@/lib/careerReadinessContent'
import { responseKey, type ProgrammeProgress, type ResponseMap } from '@/lib/careerReadinessProgramme'
import { LessonFrame, LessonLearn, LessonWrite, type LessonStep } from '@/components/lesson/LessonFrame'

/** A module's steps, in order: Learn, each task, Reflect. */
type Step = 'learn' | ItemKey

/** Where to open: Learn on a first visit, otherwise the first item not yet saved. */
function firstOpenStep(content: ModuleContent, responses: ResponseMap): Step {
  const items = [...content.tasks.map((x) => x.key), 'reflect'] as ItemKey[]
  const item = items.find((k) => !responses[responseKey(content.slug, k)])
  const anySaved = items.some((k) => responses[responseKey(content.slug, k)])
  return anySaved ? (item ?? 'reflect') : 'learn'
}

/**
 * One Global Leadership module as an interactive lesson (Paul, 18 Nov 2026): Learn
 * (short cards), Practise (its written tasks) and Reflect (one prompt), one step at a
 * time. Each response is saved on its own so nothing is lost leaving halfway, and any
 * of them can be reopened and edited. The server enforces the same minimum lengths;
 * this is just so the button says why it isn't ready.
 */
export function ModuleFlow({
  content,
  index,
  total,
  title,
  subtitle,
  responses,
  progress,
  onSave,
}: {
  content: ModuleContent
  /** 0-based position in the programme, for "Module 2 of 5". */
  index: number
  total: number
  title: string
  subtitle: ReactNode
  responses: ResponseMap
  progress: ProgrammeProgress
  onSave: (item: ItemKey, text: string) => Promise<void>
}) {
  const slug = content.slug
  const [step, setStep] = useState<Step>(() => firstOpenStep(content, responses))
  const saved = (k: ItemKey) => Boolean(responses[responseKey(slug, k)])
  const mine = progress.modules.find((m) => m.slug === slug)
  const complete = Boolean(mine?.complete)
  const next = progress.next

  const keys: { key: Step; label: string; kind: LessonStep['kind'] }[] = [
    { key: 'learn', label: 'Learn', kind: 'learn' },
    ...content.tasks.map((task, i) => ({ key: task.key as Step, label: `Task ${i + 1}`, kind: 'task' as const })),
    { key: 'reflect', label: 'Reflect', kind: 'reflect' },
  ]
  const at = keys.findIndex((s) => s.key === step)
  const steps: LessonStep[] = keys.map((s, i) => ({
    key: s.key,
    label: s.label,
    kind: s.kind,
    done: s.key === 'learn' ? saved('t1') || i < at : saved(s.key as ItemKey),
  }))
  const goNext = () => {
    const following = keys[at + 1]?.key
    if (following) setStep(following)
  }

  const task = content.tasks.find((t) => t.key === step)

  const banner = complete ? (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
        <CheckCircle2 size={16} /> Module complete
      </p>
      <p className="mt-1 text-sm text-emerald-800/90">
        You’ve finished every task here. You can reopen any step to read or change your answers.{' '}
        {next ? `Up next: ${next.title}.` : 'That’s every module. Ask a mentor to review your work from the Workbook.'}
      </p>
      <div className="mt-2">
        {next ? (
          <Link to="/career-module/$slug" params={{ slug: next.slug }} className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-900 hover:underline">
            Open {next.title} <ArrowRight size={14} />
          </Link>
        ) : (
          <Link to="/practice" className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-900 hover:underline">
            Go to the Workbook <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </div>
  ) : null

  return (
    <LessonFrame
      icon={Globe2}
      eyebrow={`Global Leadership · Module ${index + 1} of ${total}`}
      title={title}
      subtitle={subtitle}
      steps={steps}
      active={step}
      onSelect={(k) => setStep(k as Step)}
      banner={banner}
    >
      {step === 'learn' && (
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">Read this first</p>
          <LessonLearn cards={content.learn} />
        </div>
      )}

      {step !== 'learn' && (
        <LessonWrite
          key={step}
          kind={step === 'reflect' ? 'reflect' : 'task'}
          title={step === 'reflect' ? 'Reflect' : (task?.title ?? '')}
          prompt={step === 'reflect' ? content.reflection.prompt : (task?.prompt ?? '')}
          hint={step === 'reflect' ? content.reflection.hint : task?.hint}
          min={step === 'reflect' ? MIN_REFLECTION_CHARS : MIN_TASK_CHARS}
          max={MAX_RESPONSE_CHARS}
          initial={responses[responseKey(slug, step)] ?? ''}
          onSave={(text) => onSave(step, text)}
          onNext={goNext}
          last={step === 'reflect'}
        />
      )}
    </LessonFrame>
  )
}
