import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Check, CheckCircle2, Clock, Lock, PauseCircle, Send, UserCheck } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { useMyAptitudeResult } from '@/lib/dmAptitude'
import { useMyAssessmentResult } from '@/lib/careerReadinessAssessment'
import { requestMentor, useMyMatch, type MatchProgramme, type StudentMatch } from '@/lib/mentorMatches'
import { Skeleton } from '@/components/ui'

const PROGRAMME: Record<MatchProgramme, { label: string; aptitude: string; aptitudeTo: '/aptitude-assessment' | '/career-readiness-assessment' }> = {
  'digital-marketing': { label: 'Digital Marketing', aptitude: 'Digital Marketing aptitude assessment', aptitudeTo: '/aptitude-assessment' },
  'career-readiness': { label: 'Career Readiness', aptitude: 'personal aptitude assessment', aptitudeTo: '/career-readiness-assessment' },
}

/** What students most often want from a mentor, per programme, each with the
 *  sentence it puts in the message. */
const COMMON: Record<MatchProgramme, { label: string; line: string }[]> = {
  'digital-marketing': [
    { label: 'Feedback on my practice work', line: 'I’ve been practising on MySkills and would like your feedback on my work, so I know what to fix first.' },
    { label: 'Choosing a track to focus on', line: 'I’m not sure which digital marketing track suits me best and would like help choosing where to focus.' },
    { label: 'Building a portfolio project', line: 'I want to build a real project I can show employers, and would like your guidance on what to build and how.' },
    { label: 'Getting internship-ready', line: 'I’d like to be ready for an internship and want to know what to work on to get there.' },
  ],
  'career-readiness': [
    { label: 'Interview preparation', line: 'I’d like help preparing for interviews: what to expect and how to answer well.' },
    { label: 'Communicating with confidence', line: 'I’d like to communicate more clearly and confidently, in interviews and at work.' },
    { label: 'Setting career goals', line: 'I’d like help working out my career goals and a realistic plan to reach them.' },
    { label: 'CV and LinkedIn', line: 'I’d like your feedback on my CV and LinkedIn profile.' },
  ],
}
const MAX_AREAS = 3
const MAX_NOTE = 1000

const open = (m: StudentMatch | null) => (m && (m.status === 'requested' || m.status === 'active') ? m : null)

/** The message a student would write for these areas, to send as it is or edit. */
function suggest(mentorFirst: string, programme: MatchProgramme, lines: string[]): string {
  if (lines.length === 0) return ''
  return [
    `Hi ${mentorFirst},`,
    lines.join(' '),
    `I’ve taken the ${PROGRAMME[programme].aptitude}, so you can see where I stand before we start.`,
    'Thank you.',
  ].join('\n\n')
}

const primary =
  'press flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50'

/**
 * The reason a student opens a mentor's profile: asking them to be their
 * mentor. A mentor is asked for one programme, and starts from that programme's
 * aptitude report, so this works out which programme the student can ask for
 * and says plainly why if they can't. The message is built from the areas the
 * student picks (the mentor's own areas of expertise first), and stays theirs
 * to edit before it is sent.
 */
export function RequestMentoring({
  mentor,
  autoOpen = false,
  onSent,
}: {
  mentor: { id: string; name: string; expertise: string[]; accepting?: boolean }
  /** They pressed "Request mentoring" on the card: go straight to the message. */
  autoOpen?: boolean
  /** A request went through, so whatever lists mentors can show it. */
  onSent?: () => void
}) {
  const dmAptitude = useMyAptitudeResult()
  const crAptitude = useMyAssessmentResult()
  const dm = useMyMatch('digital-marketing')
  const cr = useMyMatch('career-readiness')

  const [composing, setComposing] = useState(autoOpen)
  const [programme, setProgramme] = useState<MatchProgramme | null>(null)
  const [areas, setAreas] = useState<string[]>([])
  const [note, setNote] = useState('')
  // Once they type their own words, picking areas no longer rewrites them.
  const [edited, setEdited] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [sent, setSent] = useState(false)

  const first = mentor.name.trim().split(' ')[0] || 'there'
  const loading = dmAptitude.loading || crAptitude.loading || dm.loading || cr.loading

  const state = useMemo(() => {
    const done: Record<MatchProgramme, boolean> = {
      'digital-marketing': dmAptitude.result != null,
      'career-readiness': crAptitude.result != null,
    }
    const matches: Record<MatchProgramme, StudentMatch | null> = {
      'digital-marketing': open(dm.match),
      'career-readiness': open(cr.match),
    }
    const all = Object.keys(PROGRAMME) as MatchProgramme[]
    return {
      // Already asked, or working with, this mentor.
      withThis: all.map((p) => matches[p]).find((m) => m?.mentor?.id === mentor.id) ?? null,
      // Programmes they could ask this mentor for right now.
      free: all.filter((p) => done[p] && !matches[p]),
      // Aptitude taken, but a mentor (or request) already there.
      taken: all.filter((p) => done[p] && matches[p]),
      anyAptitude: all.some((p) => done[p]),
    }
  }, [dmAptitude.result, crAptitude.result, dm.match, cr.match, mentor.id])

  // One programme free: that is the one. Two: they choose.
  useEffect(() => {
    if (state.free.length === 1) setProgramme(state.free[0])
  }, [state.free])

  const options = useMemo(() => {
    if (!programme) return []
    const own = mentor.expertise.slice(0, 4).map((x) => ({ label: x, line: `I’d like to learn from your experience in ${x}.` }))
    return [...own, ...COMMON[programme]]
  }, [mentor.expertise, programme])

  // Keep the suggested message in step with the areas, until they edit it.
  useEffect(() => {
    if (edited || !programme) return
    const lines = areas.map((a) => options.find((o) => o.label === a)?.line).filter((l): l is string => Boolean(l))
    setNote(suggest(first, programme, lines))
  }, [areas, programme, options, edited, first])

  function toggle(label: string) {
    setAreas((cur) => (cur.includes(label) ? cur.filter((a) => a !== label) : cur.length >= MAX_AREAS ? cur : [...cur, label]))
  }

  async function send() {
    if (!programme) return
    setBusy(true)
    setError(undefined)
    try {
      await requestMentor(programme, mentor.id, note.trim().slice(0, MAX_NOTE))
      setSent(true)
      void dm.reload()
      void cr.reload()
      onSent?.()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Skeleton className="mt-6 h-12 w-full rounded-full" />

  if (sent || state.withThis?.status === 'requested') {
    return (
      <div className="mt-6 rounded-2xl bg-emerald-50 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
          {sent ? <CheckCircle2 size={17} /> : <Clock size={17} />}
          {sent ? `Request sent to ${first}` : `Waiting for ${first} to reply`}
        </p>
        <p className="mt-1 text-sm text-emerald-900/80">
          We’ve emailed {first}. They’ll look at your aptitude report and accept or decline, and you’ll get an email
          either way.
        </p>
        <Link to="/practice" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-emerald-900 underline underline-offset-2">
          See it in Practice <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  if (state.withThis?.status === 'active') {
    return (
      <div className="mt-6 rounded-2xl bg-brand-50 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-brand-900">
          <UserCheck size={17} /> {first} is your {PROGRAMME[state.withThis.programme].label} mentor
        </p>
        <Link to="/practice" className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-brand-800 underline underline-offset-2">
          Go to your sessions in Practice <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  if (mentor.accepting === false) {
    return (
      <div className="mt-6">
        <button type="button" disabled className={primary}>
          <PauseCircle size={16} /> Not taking new students right now
        </button>
        <p className="mt-2 text-center text-xs text-ink-500">{first} has paused new requests. Check back later, or ask another mentor.</p>
      </div>
    )
  }

  if (!state.anyAptitude) {
    return (
      <div className="mt-6 rounded-2xl bg-ink-100 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <Lock size={15} /> Take an aptitude assessment to ask {first}
        </p>
        <p className="mt-1 text-sm text-ink-600">
          A mentor starts from your aptitude report, so they need one to say yes. It takes about five minutes.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(PROGRAMME) as MatchProgramme[]).map((p) => (
            <Link
              key={p}
              to={PROGRAMME[p].aptitudeTo}
              className="press inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              {PROGRAMME[p].label} <ArrowRight size={14} />
            </Link>
          ))}
        </div>
      </div>
    )
  }

  if (state.free.length === 0) {
    return (
      <div className="mt-6 rounded-2xl bg-ink-100 p-4">
        <p className="text-sm font-semibold text-ink-900">You already have a mentor, or a request waiting</p>
        <p className="mt-1 text-sm text-ink-600">
          You can work with one mentor per programme ({state.taken.map((p) => PROGRAMME[p].label).join(' and ')}). End or
          withdraw that one in Practice to ask {first} instead.
        </p>
        <Link to="/practice" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
          Open Practice <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  if (!composing) {
    return (
      <div className="mt-6">
        <button type="button" onClick={() => setComposing(true)} className={primary}>
          <Send size={16} /> Request mentoring from {first}
        </button>
        <p className="mt-2 text-center text-xs text-ink-500">
          {first} sees your aptitude report and decides whether to take you on. It’s free.
        </p>
      </div>
    )
  }

  const left = MAX_NOTE - note.length
  return (
    <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50/50 p-4 sm:p-5">
      <p className="font-display text-lg font-semibold text-ink-900">Ask {first} to mentor you</p>

      {state.free.length > 1 && (
        <fieldset className="mt-3">
          <legend className="text-sm font-medium text-ink-800">For which programme?</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {state.free.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={programme === p}
                onClick={() => {
                  setProgramme(p)
                  setAreas([])
                }}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  programme === p ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-300 bg-white text-ink-700 hover:bg-ink-50'
                }`}
              >
                {PROGRAMME[p].label}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {programme && (
        <>
          <fieldset className="mt-4">
            <legend className="text-sm font-medium text-ink-800">
              What do you want help with? <span className="font-normal text-ink-500">Pick up to {MAX_AREAS}.</span>
            </legend>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {options.map((o) => {
                const on = areas.includes(o.label)
                return (
                  <button
                    key={o.label}
                    type="button"
                    aria-pressed={on}
                    disabled={!on && areas.length >= MAX_AREAS}
                    onClick={() => toggle(o.label)}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
                      on ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-300 bg-white text-ink-700 hover:border-brand-300'
                    }`}
                  >
                    {on && <Check size={12} strokeWidth={3} />}
                    {o.label}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <label className="mt-4 block text-sm font-medium text-ink-800">
            Your message to {first}
            <textarea
              value={note}
              onChange={(e) => {
                setNote(e.target.value.slice(0, MAX_NOTE))
                setEdited(true)
              }}
              rows={7}
              placeholder={`Pick what you want help with above and we’ll write a first draft, or write to ${first} in your own words.`}
              className="field mt-1.5 block w-full"
            />
          </label>
          <div className="mt-1 flex items-center justify-between gap-3 text-xs text-ink-500">
            {edited && areas.length > 0 ? (
              <button type="button" onClick={() => setEdited(false)} className="font-semibold text-brand-700 hover:underline">
                Use the suggested message again
              </button>
            ) : (
              <span>You can edit this before sending.</span>
            )}
            <span className={left < 50 ? 'text-amber-700' : ''}>{left} left</span>
          </div>
        </>
      )}

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy || !programme || note.trim().length < 10}
          onClick={() => void send()}
          className="press inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={15} /> {busy ? 'Sending…' : 'Send request'}
        </button>
        <button type="button" disabled={busy} onClick={() => setComposing(false)} className="rounded-full px-4 py-2.5 text-sm font-semibold text-ink-600 hover:bg-ink-100">
          Cancel
        </button>
      </div>
    </div>
  )
}
