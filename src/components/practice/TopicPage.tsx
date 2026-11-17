import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  FlaskConical,
  Languages,
  Lightbulb,
  ListChecks,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'
import { TOPIC_CHAPTERS, topicChapter, type TopicChapter } from '@/content/dmTopics'
import { vocabularyTerms } from '@/lib/vocabulary'
import { skillTracks } from '@/lib/skillTracks'
import { questionsForTrack } from '@/lib/decisionLabs'
import { nextAttemptAt, retakeLabel, type PracticeSummary } from '@/lib/practiceResults'
import { topicSteps, type TopicLocal } from '@/lib/topicProgress'
import { useRoomsOnline } from '@/lib/focusRooms'
import { OnlineNow } from '@/components/focus/OnlineNow'
import { CheckIn } from './CheckIn'
import { STATE_META, trackState } from './practiceStatus'

/**
 * One Digital Marketing topic as a lesson page: a header with progress and a
 * Continue button, the core explanation (definition, why it matters, a simple
 * picture, the myth), a check-in, the key terms as flip cards, a tip, a common
 * mistake, a worked example, a small task, the Decision Lab, and the study room.
 * A list of all topics sits beside it on a computer. Steps with a tick are in
 * lib/topicProgress.ts.
 */

const card = 'scroll-mt-24 rounded-2xl border border-ink-200 bg-white p-5 shadow-e1 sm:p-6'
const eyebrow = 'flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500'

function Label({ icon: Icon, children, done }: { icon: typeof BookOpen; children: string; done?: boolean }) {
  return (
    <p className={eyebrow}>
      <Icon size={15} aria-hidden />
      {children}
      {done && (
        <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal text-emerald-700">
          <Check size={11} strokeWidth={3} /> Done
        </span>
      )}
    </p>
  )
}

function TermCard({ id, learned, onLearn }: { id: string; learned: boolean; onLearn: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const term = vocabularyTerms.find((t) => t.id === id)
  if (!term) return null
  return (
    <li
      className={`flex flex-col rounded-xl border p-3.5 transition-colors ${
        learned ? 'border-emerald-200 bg-emerald-50/60' : open ? 'border-brand-300 bg-brand-50/50' : 'border-ink-200 bg-ink-50'
      }`}
    >
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="text-left">
        <span className="flex items-start justify-between gap-2">
          <span className="font-semibold leading-snug text-ink-900">{term.term}</span>
          {learned && <Check size={16} strokeWidth={3} className="mt-0.5 shrink-0 text-emerald-600" aria-label="Learned" />}
        </span>
        <span className="mt-1.5 block text-sm leading-relaxed text-ink-600">
          {open || learned ? term.definition : 'Tap to see the meaning'}
        </span>
      </button>
      {open && !learned && (
        <button
          type="button"
          onClick={() => onLearn(id)}
          className="press mt-3 self-start rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-e1 transition-colors hover:bg-brand-700"
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
    <nav aria-label="Digital Marketing topics" className={bare ? '' : 'rounded-2xl border border-ink-200 bg-white p-3 shadow-e1'}>
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
  backLabel = 'All topics',
  onBack,
  onOpenTopic,
  onPractise,
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
  onPractise: (slug: string) => void
  onLearn: (termId: string) => void
  onProgress: (patch: Partial<TopicLocal>) => void
}) {
  const chapter = topicChapter(slug) as TopicChapter | undefined
  const track = skillTracks.find((t) => t.slug === slug)
  const [draft, setDraft] = useState(local.taskText)
  const [error, setError] = useState('')
  const online = useRoomsOnline(['digital-marketing'])
  if (!chapter || !track) return null

  const index = TOPIC_CHAPTERS.findIndex((t) => t.slug === slug)
  const prev = TOPIC_CHAPTERS[index - 1]
  const next = TOPIC_CHAPTERS[index + 1]
  const steps = topicSteps(slug, local, learnedIds, practice)
  const doneCount = steps.filter((s) => s.done).length
  const percent = Math.round((doneCount / steps.length) * 100)
  const upNext = steps.find((s) => !s.done)
  const done = (key: string) => steps.find((s) => s.key === key)?.done ?? false
  const termsLearned = chapter.terms.filter((id) => learnedIds.has(id)).length

  const result = practice[slug]
  const state = trackState(Boolean(result), result?.percent ?? 0)
  const opensAt = nextAttemptAt(result)
  const scenarios = questionsForTrack(slug).length

  function finishTask() {
    if (draft.trim().length < 10) {
      setError('Write your answer first, then mark the task done.')
      return
    }
    setError('')
    onProgress({ taskText: draft.trim(), taskDone: true })
  }

  const trackName = (s: string) => skillTracks.find((t) => t.slug === s)?.name ?? s
  const go = (key: string) => document.getElementById(`step-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

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
            <span>All topics</span>
            <span className="text-xs font-normal text-ink-500 group-open:hidden">Topic {index + 1} of {TOPIC_CHAPTERS.length}</span>
          </summary>
          <div className="px-2 pb-2">
            <TopicList current={slug} practice={practice} learnedIds={learnedIds} getLocal={getLocal} onOpen={onOpenTopic} bare />
          </div>
        </details>

        {/* The lesson header: where you are, and one button for what's next */}
        <header className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-5 shadow-e1 sm:p-6">
          <span className="inline-flex rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-700">
            Topic {index + 1} of {TOPIC_CHAPTERS.length}
          </span>
          <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">{track.name}</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-600">{chapter.hook}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-600">
            <span className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-2.5 py-1">
              <Clock size={12} /> About {chapter.minutes} min
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-2.5 py-1">
              <ListChecks size={12} /> {steps.length} steps
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-medium text-ink-600">{percent}% completed</p>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink-200/70" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Topic progress">
              <div className="h-full rounded-full bg-brand-600 transition-[width] duration-500" style={{ width: `${percent}%` }} />
            </div>
          </div>
          <ol className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            {steps.map((s, i) => (
              <li key={s.key}>
                <button type="button" onClick={() => go(s.key)} className="group inline-flex items-center gap-1.5 text-xs text-ink-700">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                      s.done ? 'bg-emerald-600 text-white' : s === upNext ? 'bg-brand-600 text-white' : 'bg-ink-200 text-ink-600'
                    }`}
                  >
                    {s.done ? <Check size={11} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={`group-hover:underline ${s === upNext ? 'font-semibold text-ink-900' : ''}`}>{s.label}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {upNext ? (
              <button
                type="button"
                onClick={() => go(upNext.key)}
                className="press inline-flex h-11 items-center gap-1.5 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-brand-700"
              >
                {doneCount === 0 ? 'Start learning' : 'Continue learning'}: {upNext.label} <ArrowRight size={16} />
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
                <CheckCircle2 size={16} /> Topic complete
              </span>
            )}
          </div>
        </header>

        {/* 1 · Core explanation */}
        <section id="step-read" className={card} aria-labelledby="idea-h">
          <Label icon={BookOpen} done={done('read')}>
            Core explanation
          </Label>
          <div className="mt-3 grid gap-5 md:grid-cols-[minmax(0,1fr)_15rem]">
            <div>
              <h2 id="idea-h" className="font-display text-xl font-semibold text-ink-900 sm:text-2xl">
                The core of {track.name}
              </h2>
              <div className="mt-3 space-y-3">
                {chapter.idea.map((p, i) => (
                  <p key={p.slice(0, 24)} className={`leading-8 text-ink-800 ${i === 0 ? 'text-[17px]' : 'text-[15px] text-ink-700'}`}>
                    {p}
                  </p>
                ))}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border-l-4 border-emerald-500 bg-ink-50 p-3.5">
                  <p className="text-sm font-semibold text-ink-900">Why it matters</p>
                  <ul className="mt-2 space-y-1.5">
                    {chapter.why.map((w) => (
                      <li key={w} className="flex items-start gap-2 text-sm leading-snug text-ink-700">
                        <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden /> {w}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl bg-brand-50 p-3.5">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700">
                    <Sparkles size={12} /> Simplified
                  </p>
                  <p className="mt-2 text-sm italic leading-relaxed text-ink-800">{chapter.simple}</p>
                </div>
              </div>
            </div>
            <aside className="self-start rounded-xl border border-ink-200 p-3.5">
              <p className="text-sm font-semibold text-ink-900">Common misconception</p>
              <div className="mt-3 rounded-lg bg-red-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-red-700">Myth</p>
                <p className="mt-1 text-sm leading-snug text-red-900">{chapter.myth.wrong}</p>
              </div>
              <div className="mt-2 rounded-lg bg-emerald-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">Fact</p>
                <p className="mt-1 text-sm leading-snug text-emerald-900">{chapter.myth.right}</p>
              </div>
            </aside>
          </div>
          <button
            type="button"
            onClick={() => onProgress({ read: !local.read })}
            aria-pressed={local.read}
            className={`press mt-5 inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition-colors ${
              local.read ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-brand-600 text-white shadow-e1 hover:bg-brand-700'
            }`}
          >
            {local.read ? (
              <>
                <Check size={16} strokeWidth={3} /> Read
              </>
            ) : (
              'Mark as read'
            )}
          </button>
        </section>

        {/* 2 · Check-in */}
        {chapter.checks && (
          <section id="step-check" className={card} aria-labelledby="check-h">
            <Label icon={ListChecks} done={done('check')}>
              Check-in
            </Label>
            <h2 id="check-h" className="mt-1.5 font-display text-lg font-semibold text-ink-900">
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
          </section>
        )}

        {/* 3 · Key terms */}
        <section id="step-terms" className={card} aria-labelledby="terms-h">
          <Label icon={Languages} done={done('terms')}>
            Key terms
          </Label>
          <h2 id="terms-h" className="mt-1.5 font-display text-lg font-semibold text-ink-900">
            Six words to know first
          </h2>
          <p className="mt-1 text-sm text-ink-600">
            Tap a card to see the meaning. Choose “I know this” when you do. {termsLearned} of {chapter.terms.length} learned.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {chapter.terms.map((id) => (
              <TermCard key={id} id={id} learned={learnedIds.has(id)} onLearn={onLearn} />
            ))}
          </ul>
        </section>

        {/* A tip, the mistake that goes with it, and an imagined example */}
        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-brand-200 bg-brand-50 p-5 shadow-e1" aria-label="Tip">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
              <Lightbulb size={15} aria-hidden /> Tip
            </p>
            <p className="mt-2 leading-relaxed text-ink-900">{chapter.tip}</p>
          </section>
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-e1" aria-label="Common mistake">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
              <AlertTriangle size={15} aria-hidden /> Common mistake
            </p>
            <p className="mt-2 leading-relaxed text-ink-900">{chapter.mistake}</p>
          </section>
        </div>
        <section className={card} aria-label="Worked example">
          <p className={eyebrow}>
            <Sparkles size={15} aria-hidden /> Worked example · {chapter.example.title}
          </p>
          <p className="mt-2 leading-relaxed text-ink-800">{chapter.example.body}</p>
          <p className="mt-2 text-xs text-ink-500">An imagined example, to show the idea.</p>
        </section>

        {/* 4 · The small task */}
        <section id="step-task" className={`${card} border-brand-300`} aria-labelledby="task-h">
          <Label icon={Target} done={done('task')}>
            Small task · about 10 min
          </Label>
          <h2 id="task-h" className="mt-1.5 font-display text-lg font-semibold text-ink-900">
            {chapter.task.title}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-600">{chapter.task.brief}</p>
          <label htmlFor="task-answer" className="sr-only">
            Your answer
          </label>
          <textarea
            id="task-answer"
            rows={4}
            value={draft}
            readOnly={local.taskDone}
            onChange={(e) => {
              setDraft(e.target.value)
              setError('')
            }}
            placeholder={chapter.task.placeholder}
            className="mt-3 w-full resize-y rounded-xl border border-ink-200 bg-white p-3 text-sm leading-relaxed text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 read-only:bg-ink-50"
          />
          {error && (
            <p role="alert" className="mt-1.5 text-sm text-red-600">
              {error}
            </p>
          )}
          {local.taskDone && (
            <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm leading-relaxed text-emerald-900">
              <span className="font-semibold">What a good answer looks like. </span>
              {chapter.task.after}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
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
                className="press h-10 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-brand-700"
              >
                Mark task done
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-ink-500">Your answer is saved on this device and is only for you.</p>
        </section>

        {/* 5 · Practise */}
        <section id="step-practise" className={card} aria-labelledby="practise-h">
          <Label icon={FlaskConical} done={done('practise')}>
            Practise
          </Label>
          <h2 id="practise-h" className="mt-1.5 font-display text-lg font-semibold text-ink-900">
            {track.name} Decision Lab
          </h2>
          <p className="mt-1 text-sm text-ink-600">
            {scenarios} real business situations. Read the brief, make the call, and see why after you finish.
          </p>
          {result && (
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-ink-700">
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATE_META[state].pill}`}>
                {STATE_META[state].label}
              </span>
              Best score {result.percent}% · {result.attempts} attempt{result.attempts === 1 ? '' : 's'}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={Boolean(opensAt)}
              onClick={() => onPractise(slug)}
              className="press inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-ink-300"
            >
              {result ? 'Practise again' : 'Start practising'} <ArrowRight size={15} />
            </button>
            {opensAt && <span className="text-sm text-ink-600">Opens again {retakeLabel(opensAt)}.</span>}
          </div>
        </section>

        {/* Study with others */}
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-200 bg-white p-5 shadow-e1 sm:p-6" aria-label="Study room">
          <div className="min-w-0">
            <p className={eyebrow}>
              <Users size={15} aria-hidden /> Study room
            </p>
            <p className="mt-1.5 font-semibold text-ink-900">Study this topic alongside others</p>
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

        {/* On to the next topic */}
        <nav className="flex items-center justify-between gap-3 pt-1" aria-label="Previous and next topic">
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
              Next topic: {trackName(next.slug)} <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
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
