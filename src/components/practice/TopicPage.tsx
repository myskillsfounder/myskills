import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowLeft, ArrowRight, BookOpen, Check, Clock, FlaskConical, Languages, Lightbulb, Pencil, Target, Users } from 'lucide-react'
import { TOPIC_CHAPTERS, topicChapter, type TopicChapter } from '@/content/dmTopics'
import { vocabularyTerms } from '@/lib/vocabulary'
import { skillTracks } from '@/lib/skillTracks'
import { questionsForTrack } from '@/lib/decisionLabs'
import { nextAttemptAt, retakeLabel, type PracticeSummary } from '@/lib/practiceResults'
import { TOPIC_STEPS, topicSteps, type TopicLocal } from '@/lib/topicProgress'
import { useRoomsOnline } from '@/lib/focusRooms'
import { OnlineNow } from '@/components/focus/OnlineNow'
import { STATE_META, trackState } from './practiceStatus'

/**
 * One Digital Marketing topic as a textbook page: the big idea, the key terms as
 * flip cards, a tip, a common mistake, a small task, the Decision Lab to practise,
 * and the study room for the programme. Four of those are steps with a tick
 * (Read, Terms, Task, Practise); see lib/topicProgress.ts.
 */

const section = 'scroll-mt-24 rounded-2xl border border-ink-200 bg-white p-5 shadow-e1 sm:p-6'
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

export function TopicPage({
  slug,
  practice,
  learnedIds,
  local,
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
  const current = steps.indexOf(false)
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
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="group inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
      >
        <ArrowLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1" /> All topics
      </button>

      {/* The chapter header, with the four steps */}
      <header className="rounded-2xl border border-ink-200 bg-white p-5 shadow-e1 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
              Digital Marketing · Topic {index + 1} of {TOPIC_CHAPTERS.length}
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">{track.name}</h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-600">{chapter.hook}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-600">
            <Clock size={12} /> About {chapter.minutes} min
          </span>
        </div>
        <ol className="mt-5 grid grid-cols-4 gap-2">
          {TOPIC_STEPS.map((label, i) => {
            const done = steps[i]
            const now = i === current
            return (
              <li key={label}>
                <button type="button" onClick={() => go(`step-${i}`)} className="group flex w-full flex-col items-center gap-1.5 text-center">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                      done
                        ? 'bg-emerald-600 text-white'
                        : now
                          ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                          : 'bg-ink-100 text-ink-500 group-hover:bg-ink-200'
                    }`}
                  >
                    {done ? <Check size={16} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={`text-xs ${now ? 'font-semibold text-ink-900' : 'text-ink-600'}`}>{label}</span>
                </button>
              </li>
            )
          })}
        </ol>
      </header>

      {/* 1 · The big idea, set like a textbook page */}
      <section id="step-0" className={section} aria-labelledby="idea-h">
        <Label icon={BookOpen} done={local.read}>The big idea</Label>
        <h2 id="idea-h" className="sr-only">The big idea</h2>
        <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,1fr)_14rem]">
          <div className="space-y-4 border-l-4 border-brand-200 pl-4 sm:pl-5">
            {chapter.idea.map((p) => (
              <p key={p.slice(0, 24)} className="text-[17px] leading-8 text-ink-800">
                {p}
              </p>
            ))}
          </div>
          <aside className="self-start rounded-xl bg-amber-50 p-3.5 text-sm leading-relaxed text-amber-900">
            <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
              <Pencil size={12} /> Margin note
            </span>
            {chapter.note}
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

      {/* 2 · Key terms */}
      <section id="step-1" className={section} aria-labelledby="terms-h">
        <Label icon={Languages} done={steps[1]}>Key terms</Label>
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

      {/* A tip and the mistake that goes with it */}
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

      {/* 3 · The small task */}
      <section id="step-2" className={`${section} border-brand-300`} aria-labelledby="task-h">
        <Label icon={Target} done={local.taskDone}>Small task · about 10 min</Label>
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

      {/* 4 · Practise */}
      <section id="step-3" className={section} aria-labelledby="practise-h">
        <Label icon={FlaskConical} done={steps[3]}>Practise</Label>
        <h2 id="practise-h" className="mt-1.5 font-display text-lg font-semibold text-ink-900">
          {track.name} Decision Lab
        </h2>
        <p className="mt-1 text-sm text-ink-600">
          {scenarios} real business situations. Read the brief, make the call, and see why after you finish.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {result && (
            <span className="inline-flex items-center gap-2 text-sm text-ink-700">
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATE_META[state].pill}`}>
                {STATE_META[state].label}
              </span>
              Best score {result.percent}% · {result.attempts} attempt{result.attempts === 1 ? '' : 's'}
            </span>
          )}
        </div>
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
      <nav className="flex items-center justify-between gap-3 pt-1" aria-label="Topics">
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
  )
}
