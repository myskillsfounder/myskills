import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  Check,
  Compass,
  FlaskConical,
  Globe,
  Languages,
  ListChecks,
  Megaphone,
  MousePointerClick,
  PartyPopper,
  PenLine,
  Search,
  Sparkles,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { TOPIC_CHAPTERS, topicChapter, type TopicChapter } from '@/content/dmTopics'
import { vocabularyTerms } from '@/lib/vocabulary'
import { skillTracks } from '@/lib/skillTracks'
import { questionsForTrack } from '@/lib/decisionLabs'
import { nextAttemptAt, type PracticeSummary } from '@/lib/practiceResults'
import { topicSteps, type TopicLocal, type TopicStep } from '@/lib/topicProgress'
import { useRoomsOnline } from '@/lib/focusRooms'
import { OnlineNow } from '@/components/focus/OnlineNow'
import { CheckIn } from './CheckIn'
import { PracticeRound } from './PracticeRound'
import { STATE_META, trackState } from './practiceStatus'

/**
 * One Digital Marketing topic as a lesson you move through one step at a time
 * (Paul, 18 Nov 2026: a better learning experience, colour and UI). A dark
 * header with the progress and a step track, then one step on screen: Read,
 * Check-in, Terms, Task, Practise. Each step has its own colour, and Continue
 * moves on. A list of all topics sits beside it on a computer. Which steps are
 * done is in lib/topicProgress.ts.
 *
 * The tip, the common mistake and the worked example are kept in
 * content/dmTopics.ts but not shown for now (Paul asked to remove them).
 */

type Key = TopicStep['key']

/** Each step's colour and icon. Full class names, so Tailwind can see them. */
const LOOK: Record<
  Key,
  { icon: LucideIcon; label: string; node: string; band: string; soft: string; text: string; button: string; ring: string }
> = {
  read: {
    icon: BookOpen,
    label: 'Read',
    node: 'bg-brand-600',
    band: 'from-brand-600 to-brand-700',
    soft: 'bg-brand-50 border-brand-200',
    text: 'text-brand-700',
    button: 'bg-brand-600 hover:bg-brand-700',
    ring: 'ring-brand-300',
  },
  check: {
    icon: ListChecks,
    label: 'Check-in',
    node: 'bg-sky-600',
    band: 'from-sky-600 to-sky-700',
    soft: 'bg-sky-50 border-sky-200',
    text: 'text-sky-700',
    button: 'bg-sky-600 hover:bg-sky-700',
    ring: 'ring-sky-300',
  },
  terms: {
    icon: Languages,
    label: 'Terms',
    node: 'bg-amber-600',
    band: 'from-amber-600 to-amber-700',
    soft: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    button: 'bg-amber-600 hover:bg-amber-700',
    ring: 'ring-amber-300',
  },
  task: {
    icon: Target,
    label: 'Task',
    node: 'bg-rose-600',
    band: 'from-rose-600 to-rose-700',
    soft: 'bg-rose-50 border-rose-200',
    text: 'text-rose-700',
    button: 'bg-rose-600 hover:bg-rose-700',
    ring: 'ring-rose-300',
  },
  practise: {
    icon: FlaskConical,
    label: 'Practise',
    node: 'bg-emerald-600',
    band: 'from-emerald-600 to-emerald-700',
    soft: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    button: 'bg-emerald-600 hover:bg-emerald-700',
    ring: 'ring-emerald-300',
  },
}

const TOPIC_ICON: Record<string, LucideIcon> = {
  'marketing-fundamentals': Compass,
  'market-research': Search,
  'meta-ads': Megaphone,
  'google-ads': MousePointerClick,
  'seo-aeo': Globe,
  analytics: BarChart3,
  'content-marketing': PenLine,
  'marketing-automation-ai': Bot,
}

/** What each step asks the learner to do, for the Continue button. */
const DO: Record<Key, string> = {
  read: 'Read the big idea',
  check: 'Take the check-in',
  terms: 'Learn the key terms',
  task: 'Do the small task',
  practise: 'Practise the Decision Lab',
}

function TermCard({ id, learned, onLearn }: { id: string; learned: boolean; onLearn: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const term = vocabularyTerms.find((t) => t.id === id)
  if (!term) return null
  return (
    <li
      className={`flex flex-col rounded-2xl border p-4 transition-all duration-300 ${
        learned
          ? 'border-emerald-200 bg-emerald-50'
          : open
            ? 'border-amber-300 bg-amber-50 shadow-e1'
            : 'border-ink-200 bg-white hover:-translate-y-0.5 hover:border-amber-300'
      }`}
    >
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="text-left">
        <span className="flex items-start justify-between gap-2">
          <span className="font-display text-base font-semibold leading-snug text-ink-900">{term.term}</span>
          {learned ? (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white" aria-label="Learned">
              <Check size={14} strokeWidth={3} />
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
              {open ? 'Meaning' : 'Tap'}
            </span>
          )}
        </span>
        <span className={`mt-2 block text-sm leading-relaxed ${open || learned ? 'text-ink-800' : 'text-ink-500'}`}>
          {open || learned ? term.definition : 'Tap to see the meaning'}
        </span>
      </button>
      {open && !learned && (
        <button
          type="button"
          onClick={() => onLearn(id)}
          className="press mt-3 self-start rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-e1 transition-colors hover:bg-amber-700"
        >
          I know this
        </button>
      )}
    </li>
  )
}

/** Every topic, beside the lesson, with how far through each one is. */
function TopicList({
  current,
  practice,
  learnedIds,
  getLocal,
  onOpen,
  bare = false,
}: {
  current: string
  practice: PracticeSummary
  learnedIds: Set<string>
  getLocal: (slug: string) => TopicLocal
  onOpen: (slug: string) => void
  /** Inside another card: no border of its own. */
  bare?: boolean
}) {
  return (
    <nav aria-label="Digital Marketing modules" className={bare ? '' : 'rounded-2xl border border-ink-200 bg-white p-3 shadow-e1'}>
      <p className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">Digital Marketing</p>
      <ul className="space-y-0.5">
        {TOPIC_CHAPTERS.map((c, i) => {
          const steps = topicSteps(c.slug, getLocal(c.slug), learnedIds, practice)
          const done = steps.filter((s) => s.done).length
          const complete = done === steps.length
          const active = c.slug === current
          return (
            <li key={c.slug}>
              <button
                type="button"
                onClick={() => onOpen(c.slug)}
                aria-current={active ? 'page' : undefined}
                className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors ${
                  active ? 'bg-brand-50 font-semibold text-brand-800' : 'text-ink-700 hover:bg-ink-100'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                    complete ? 'bg-emerald-600 text-white' : active ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600'
                  }`}
                >
                  {complete ? <Check size={13} strokeWidth={3} /> : i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate">{skillTracks.find((t) => t.slug === c.slug)?.name}</span>
                <span className="shrink-0 text-xs text-ink-500">
                  {done}/{steps.length}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function TopicPage({
  slug,
  practice,
  learnedIds,
  local,
  getLocal,
  backLabel = 'All modules',
  onBack,
  onOpenTopic,
  onPractise,
  onPracticeSubmitted,
  onLearn,
  onProgress,
}: {
  slug: string
  practice: PracticeSummary
  learnedIds: Set<string>
  local: TopicLocal
  getLocal: (slug: string) => TopicLocal
  /** Where Back goes, in words. */
  backLabel?: string
  onBack: () => void
  onOpenTopic: (slug: string) => void
  /** Opens the full Decision Lab for this topic. */
  onPractise: (slug: string) => void
  /** A four-question round was saved: refresh the scores. */
  onPracticeSubmitted: () => void | Promise<void>
  onLearn: (termId: string) => void
  onProgress: (patch: Partial<TopicLocal>) => void
}) {
  const chapter = topicChapter(slug) as TopicChapter | undefined
  const track = skillTracks.find((t) => t.slug === slug)
  const steps = topicSteps(slug, local, learnedIds, practice)
  // The step on screen: the first one not done yet, or Read. 'done' is the wrap-up.
  const [active, setActive] = useState<Key | 'done'>(() => steps.find((s) => !s.done)?.key ?? 'read')
  const [draft, setDraft] = useState(local.taskText)
  const [error, setError] = useState('')
  const online = useRoomsOnline(['digital-marketing'])
  if (!chapter || !track) return null

  const index = TOPIC_CHAPTERS.findIndex((t) => t.slug === slug)
  const prev = TOPIC_CHAPTERS[index - 1]
  const next = TOPIC_CHAPTERS[index + 1]
  const doneCount = steps.filter((s) => s.done).length
  const percent = Math.round((doneCount / steps.length) * 100)
  const upNext = steps.find((s) => !s.done)
  const termsLearned = chapter.terms.filter((id) => learnedIds.has(id)).length
  const TopicIcon = TOPIC_ICON[slug] ?? Compass

  const result = practice[slug]
  const state = trackState(Boolean(result), result?.percent ?? 0)
  const opensAt = nextAttemptAt(result)
  const scenarios = questionsForTrack(slug).length

  const activeIndex = active === 'done' ? steps.length : Math.max(0, steps.findIndex((s) => s.key === active))
  const here = active === 'done' ? null : (steps[activeIndex] ?? steps[0])

  function show(key: Key | 'done') {
    setActive(key)
    // Bring the step to the top once it has drawn.
    window.setTimeout(() => document.getElementById('lesson-step')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30)
  }

  function advance() {
    if (here?.key === 'read' && !local.read) onProgress({ read: true })
    const following = steps[activeIndex + 1]
    show(following ? following.key : 'done')
  }

  function finishTask() {
    if (draft.trim().length < 10) {
      setError('Write your answer first, then mark the task done.')
      return
    }
    setError('')
    onProgress({ taskText: draft.trim(), taskDone: true })
  }

  const trackName = (s: string) => skillTracks.find((t) => t.slug === s)?.name ?? s

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:gap-6">
      <div className="min-w-0 space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
        >
          <ArrowLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1" /> {backLabel}
        </button>

        {/* On a phone the topic list folds away at the top. */}
        <details className="group rounded-2xl border border-ink-200 bg-white shadow-e1 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-ink-900">
            <span>All modules</span>
            <span className="text-xs font-normal text-ink-500 group-open:hidden">
              Module {index + 1} of {TOPIC_CHAPTERS.length}
            </span>
          </summary>
          <div className="px-2 pb-2">
            <TopicList current={slug} practice={practice} learnedIds={learnedIds} getLocal={getLocal} onOpen={onOpenTopic} bare />
          </div>
        </details>

        {/* The lesson header: where you are, and the track of steps */}
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
              <TopicIcon size={28} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                Module {index + 1} of {TOPIC_CHAPTERS.length} · About {chapter.minutes} min
              </p>
              <h1 className="mt-1 font-display text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">{track.name}</h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/75">{chapter.hook}</p>
            </div>
          </div>

          <div className="relative mt-5">
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>
                {doneCount} of {steps.length} steps done
              </span>
              <span className="font-semibold text-white">{percent}%</span>
            </div>
            <div
              className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/15"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Module progress"
            >
              <div className="h-full rounded-full bg-gradient-to-r from-brand-200 to-emerald-300 transition-[width] duration-500" style={{ width: `${percent}%` }} />
            </div>
          </div>

          {/* The step track: tap any step to go to it */}
          <ol className="relative mt-5 grid" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
            {steps.map((s, i) => {
              const look = LOOK[s.key]
              const Icon = look.icon
              const on = active === s.key
              return (
                <li key={s.key} className="relative flex flex-col items-center">
                  {i > 0 && (
                    <span
                      aria-hidden
                      className={`absolute right-1/2 top-[19px] h-0.5 w-full ${steps[i - 1].done ? 'bg-emerald-400/70' : 'bg-white/15'}`}
                    />
                  )}
                  <button type="button" onClick={() => show(s.key)} aria-current={on ? 'step' : undefined} className="group relative flex flex-col items-center gap-1.5">
                    <span
                      className={`relative flex h-10 w-10 items-center justify-center rounded-full text-white transition-all duration-300 ${
                        s.done ? 'bg-emerald-600' : look.node
                      } ${on ? 'scale-110 ring-4 ring-white/30' : s.done ? '' : 'opacity-60 group-hover:opacity-100'}`}
                    >
                      {s.done ? <Check size={18} strokeWidth={3} /> : <Icon size={17} />}
                    </span>
                    <span className={`text-[11px] ${on ? 'font-semibold text-white' : 'text-white/65'}`}>{look.label}</span>
                  </button>
                </li>
              )
            })}
          </ol>

          {upNext && (
            <div className="relative mt-5">
              <button
                type="button"
                onClick={() => show(upNext.key)}
                className="press inline-flex h-11 items-center gap-1.5 rounded-xl bg-white px-5 text-sm font-semibold text-ink-900 shadow-e1 transition-transform hover:-translate-y-0.5"
              >
                {doneCount === 0 ? 'Start' : 'Continue'}: {DO[upNext.key]} <ArrowRight size={16} />
              </button>
            </div>
          )}
        </header>

        {/* The step on screen */}
        <section id="lesson-step" className="scroll-mt-24 overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-e1" aria-live="polite">
          {here ? (
            <>
              <div className={`flex items-center justify-between gap-3 bg-gradient-to-r px-5 py-3 text-white sm:px-7 ${LOOK[here.key].band}`}>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  {(() => {
                    const Icon = LOOK[here.key].icon
                    return <Icon size={17} aria-hidden />
                  })()}
                  Step {activeIndex + 1} of {steps.length} · {LOOK[here.key].label}
                </p>
                {here.done && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
                    <Check size={12} strokeWidth={3} /> Done
                  </span>
                )}
              </div>

              <div className="p-5 sm:p-7">
                {/* READ */}
                {here.key === 'read' && (
                  <div>
                    <h2 className="font-display text-xl font-semibold text-ink-900 sm:text-2xl">The core of {track.name}</h2>
                    <div className="mt-4 space-y-4">
                      {chapter.idea.map((p, i) => (
                        <p key={p.slice(0, 24)} className={`leading-8 ${i === 0 ? 'text-[18px] text-ink-900' : 'text-[16px] text-ink-700'}`}>
                          {p}
                        </p>
                      ))}
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-sm font-semibold text-emerald-800">Why it matters</p>
                        <ul className="mt-3 space-y-2.5">
                          {chapter.why.map((w, i) => (
                            <li key={w} className="flex items-start gap-2.5 text-sm leading-snug text-ink-800">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-semibold text-white">{i + 1}</span>
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-sky-800">
                          <Sparkles size={14} /> In everyday words
                        </p>
                        <p className="mt-3 text-sm italic leading-relaxed text-ink-800">{chapter.simple}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-red-700">Myth</p>
                        <p className="mt-1.5 text-sm leading-relaxed text-ink-900">{chapter.myth.wrong}</p>
                      </div>
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Fact</p>
                        <p className="mt-1.5 text-sm leading-relaxed text-ink-900">{chapter.myth.right}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* CHECK-IN */}
                {here.key === 'check' && chapter.checks && (
                  <div>
                    <h2 className="font-display text-xl font-semibold text-ink-900 sm:text-2xl">
                      Do you have it? {chapter.checks.length} quick questions
                    </h2>
                    <p className="mt-1 text-sm text-ink-600">Pick an answer and lock it. You’ll see why right away. Any you miss come back.</p>
                    <CheckIn
                      key={slug}
                      questions={chapter.checks}
                      done={local.checkDone}
                      firstTry={local.checkFirstTry}
                      onFinish={(n) => onProgress({ checkDone: true, checkFirstTry: n })}
                    />
                  </div>
                )}

                {/* TERMS */}
                {here.key === 'terms' && (
                  <div>
                    <h2 className="font-display text-xl font-semibold text-ink-900 sm:text-2xl">Six words to know first</h2>
                    <p className="mt-1 text-sm text-ink-600">
                      Tap a card to see the meaning, then choose “I know this”. {termsLearned} of {chapter.terms.length} learned.
                    </p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-200">
                      <div className="h-full rounded-full bg-amber-600 transition-[width] duration-500" style={{ width: `${(termsLearned / chapter.terms.length) * 100}%` }} />
                    </div>
                    <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {chapter.terms.map((id) => (
                        <TermCard key={id} id={id} learned={learnedIds.has(id)} onLearn={onLearn} />
                      ))}
                    </ul>
                  </div>
                )}

                {/* TASK */}
                {here.key === 'task' && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">About 10 minutes</p>
                    <h2 className="mt-1 font-display text-xl font-semibold text-ink-900 sm:text-2xl">{chapter.task.title}</h2>
                    <p className="mt-2 leading-relaxed text-ink-700">{chapter.task.brief}</p>
                    <label htmlFor="task-answer" className="sr-only">
                      Your answer
                    </label>
                    <textarea
                      id="task-answer"
                      rows={5}
                      value={draft}
                      readOnly={local.taskDone}
                      onChange={(e) => {
                        setDraft(e.target.value)
                        setError('')
                      }}
                      placeholder={chapter.task.placeholder}
                      className="mt-4 w-full resize-y rounded-2xl border border-rose-200 bg-white p-4 text-[15px] leading-relaxed text-ink-900 placeholder:text-ink-400 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200 read-only:bg-ink-50"
                    />
                    {error && (
                      <p role="alert" className="mt-1.5 text-sm text-red-600">
                        {error}
                      </p>
                    )}
                    {local.taskDone && (
                      <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-relaxed text-ink-900">
                        <span className="font-semibold text-emerald-800">What a good answer looks like. </span>
                        {chapter.task.after}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {local.taskDone ? (
                        <button
                          type="button"
                          onClick={() => onProgress({ taskDone: false })}
                          className="press h-10 rounded-xl border border-ink-300 px-4 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-100"
                        >
                          Edit my answer
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={finishTask}
                          className="press h-10 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-rose-700"
                        >
                          Mark task done
                        </button>
                      )}
                      <span className="text-xs text-ink-500">Your answer is saved on this device and is only for you.</span>
                    </div>
                  </div>
                )}

                {/* PRACTISE */}
                {here.key === 'practise' && (
                  <div>
                    <h2 className="font-display text-xl font-semibold text-ink-900 sm:text-2xl">Practise {track.name}</h2>
                    {result && (
                      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <span className="font-display text-3xl font-semibold text-emerald-800">{result.percent}%</span>
                        <span className="text-sm text-ink-800">
                          best score · {result.attempts} attempt{result.attempts === 1 ? '' : 's'}
                        </span>
                        <span className={`ml-auto inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATE_META[state].pill}`}>
                          {STATE_META[state].label}
                        </span>
                      </div>
                    )}
                    <PracticeRound
                      key={slug}
                      slug={slug}
                      trackName={track.name}
                      fullCount={scenarios}
                      opensAt={opensAt}
                      onSubmitted={onPracticeSubmitted}
                      onContinue={() => show('done')}
                      onFullLab={() => onPractise(slug)}
                    />
                  </div>
                )}

                {/* Back and Continue */}
                <div className="mt-7 flex items-center justify-between gap-3 border-t border-ink-200 pt-4">
                  {activeIndex > 0 ? (
                    <button
                      type="button"
                      onClick={() => show(steps[activeIndex - 1].key)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
                    >
                      <ArrowLeft size={15} /> {LOOK[steps[activeIndex - 1].key].label}
                    </button>
                  ) : (
                    <span />
                  )}
                  {/* The practice round has its own button to finish the module. */}
                  {here.key !== 'practise' && (
                    <button
                      type="button"
                      onClick={advance}
                      className={`press inline-flex h-11 items-center gap-1.5 rounded-xl px-5 text-sm font-semibold text-white shadow-e1 transition-colors ${LOOK[here.key].button}`}
                    >
                      {here.key === 'read' && !local.read
                        ? 'Got it, continue'
                        : steps[activeIndex + 1]
                          ? `Continue to ${LOOK[steps[activeIndex + 1].key].label}`
                          : 'Finish'}
                      <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Wrap-up */
            <div className="p-6 text-center sm:p-9">
              {doneCount === steps.length ? (
                <>
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-e1">
                    <PartyPopper size={26} />
                  </span>
                  <h2 className="mt-4 font-display text-2xl font-semibold text-ink-900">{track.name} complete</h2>
                  <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-600">You’ve been through every step of this module. Keep the momentum: take the next one while it’s fresh.</p>
                  {next ? (
                    <button
                      type="button"
                      onClick={() => onOpenTopic(next.slug)}
                      className="press mt-5 inline-flex h-11 items-center gap-1.5 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-brand-700"
                    >
                      Next module: {trackName(next.slug)} <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onBack}
                      className="press mt-5 inline-flex h-11 items-center gap-1.5 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-brand-700"
                    >
                      {backLabel} <ArrowRight size={16} />
                    </button>
                  )}
                </>
              ) : (
                <>
                  <h2 className="font-display text-xl font-semibold text-ink-900">Nearly there</h2>
                  <p className="mt-1.5 text-sm text-ink-600">These steps still need doing:</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {steps
                      .filter((s) => !s.done)
                      .map((s) => (
                        <button
                          key={s.key}
                          type="button"
                          onClick={() => show(s.key)}
                          className={`press inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-white shadow-e1 transition-colors ${LOOK[s.key].button}`}
                        >
                          {LOOK[s.key].label} <ArrowRight size={15} />
                        </button>
                      ))}
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        {/* Study with others */}
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-200 bg-white p-5 shadow-e1" aria-label="Study room">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
              <Users size={15} aria-hidden /> Study room
            </p>
            <p className="mt-1.5 font-semibold text-ink-900">Study this module alongside others</p>
            <div className="mt-1.5">
              <OnlineNow people={online['digital-marketing']} max={4} empty="No one in the room yet. Be the first." />
            </div>
          </div>
          <Link
            to="/study-rooms/$room"
            params={{ room: 'digital-marketing' }}
            className="press inline-flex h-10 items-center gap-1.5 rounded-xl border border-ink-300 px-4 text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-100"
          >
            Open the room <ArrowRight size={15} />
          </Link>
        </section>

        {/* Other topics */}
        <nav className="flex items-center justify-between gap-3 pt-1" aria-label="Previous and next module">
          {prev ? (
            <button
              type="button"
              onClick={() => onOpenTopic(prev.slug)}
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
            >
              <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" /> {trackName(prev.slug)}
            </button>
          ) : (
            <span />
          )}
          {next && (
            <button
              type="button"
              onClick={() => onOpenTopic(next.slug)}
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700"
            >
              Next module: {trackName(next.slug)} <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </nav>
      </div>

      {/* The topic list, beside the lesson on a computer */}
      <div className="hidden lg:sticky lg:top-24 lg:block">
        <TopicList current={slug} practice={practice} learnedIds={learnedIds} getLocal={getLocal} onOpen={onOpenTopic} />
      </div>
    </div>
  )
}

