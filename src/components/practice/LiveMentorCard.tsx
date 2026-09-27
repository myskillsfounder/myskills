import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Clock, Lock, UserCheck, Users } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import type { Mentor } from '@/lib/mentors'
import {
  fetchMatchableMentors,
  leaveMatch,
  requestMentor,
  useMyMatch,
  type MatchProgramme,
} from '@/lib/mentorMatches'
import { Alert, Avatar, Button, Textarea } from '@/components/ui'

const Rings = () => (
  <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 opacity-[0.16]">
    <svg width="200" height="200" viewBox="0 0 200 200" fill="none" stroke="#f6e3c8" strokeWidth="2">
      <circle cx="130" cy="70" r="76" />
      <circle cx="130" cy="70" r="56" />
      <circle cx="130" cy="70" r="36" />
      <circle cx="130" cy="70" r="16" />
    </svg>
  </span>
)

const shell = 'surface-wood-dark rise-in relative overflow-hidden rounded-2xl p-5 shadow-e2 sm:p-6'
const eyebrow = 'text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60'

/**
 * The live-mentor stage of a programme. It opens once the student has taken
 * the programme's aptitude assessment — that report is where the mentor
 * starts. The student asks one mentor; the mentor accepts or declines; they
 * arrange sessions themselves and the mentor logs each one, which counts as a
 * confirmed live session in the Career Readiness Score.
 */
export function LiveMentorCard({
  programme,
  aptitudeDone,
  aptitudeTo,
  sessions,
}: {
  programme: MatchProgramme
  aptitudeDone: boolean
  /** Where the programme's aptitude assessment lives, for the locked state. */
  aptitudeTo: '/aptitude-assessment' | '/career-readiness-assessment'
  /** Confirmed live sessions on this programme so far. */
  sessions: number
}) {
  const { match, loading, reload } = useMyMatch(programme)
  const [mentors, setMentors] = useState<Mentor[] | null>(null)
  const [picked, setPicked] = useState<Mentor | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setError(undefined)
    try {
      await fn()
      await reload()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  async function openPicker() {
    setError(undefined)
    try {
      setMentors(await fetchMatchableMentors())
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  if (loading) return null

  const open = match && (match.status === 'requested' || match.status === 'active') ? match : null

  return (
    <section className={shell}>
      <Rings />
      <div className="relative">
        <p className={eyebrow}>Live mentor sessions</p>

        {!aptitudeDone ? (
          <>
            <h3 className="mt-1.5 flex items-center gap-2 font-display text-2xl font-semibold leading-tight text-white">
              <Lock size={18} className="text-white/60" /> Take the aptitude assessment first
            </h3>
            <p className="mt-1.5 text-sm text-white/70">Your mentor starts from that report.</p>
            <Link
              to={aptitudeTo}
              className="press mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 shadow-e2 hover:bg-brand-50"
            >
              Take it now <ArrowRight size={16} />
            </Link>
          </>
        ) : open?.status === 'active' ? (
          <>
            <div className="mt-2 flex items-center gap-3">
              <Avatar name={open.mentor?.full_name ?? 'Mentor'} src={open.mentor?.avatar_url ?? undefined} size={44} />
              <div className="min-w-0">
                <h3 className="truncate font-display text-2xl font-semibold leading-tight text-white">
                  {open.mentor?.full_name ?? 'Your mentor'}
                </h3>
                {open.mentor?.headline && <p className="truncate text-xs text-white/60">{open.mentor.headline}</p>}
              </div>
            </div>
            <p className="mt-3 text-sm text-white/70">
              Your mentor will arrange sessions with you and log each one here.{' '}
              <span className="font-semibold text-white">{sessions}</span> {sessions === 1 ? 'session' : 'sessions'} so
              far.
            </p>
            {open.mentor_note && <p className="mt-2 rounded-xl bg-white/10 p-3 text-sm text-white/80">“{open.mentor_note}”</p>}
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(() => leaveMatch(open.id))}
              className="mt-3 text-xs font-semibold text-white/60 hover:text-white disabled:opacity-50"
            >
              End mentoring
            </button>
          </>
        ) : open?.status === 'requested' ? (
          <>
            <h3 className="mt-1.5 flex items-center gap-2 font-display text-2xl font-semibold leading-tight text-white">
              <Clock size={18} className="text-white/60" /> Waiting for {open.mentor?.full_name ?? 'your mentor'}
            </h3>
            <p className="mt-1.5 text-sm text-white/70">We’ve emailed them. You’ll get an email when they reply.</p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(() => leaveMatch(open.id))}
              className="mt-3 text-xs font-semibold text-white/60 hover:text-white disabled:opacity-50"
            >
              Withdraw request
            </button>
          </>
        ) : (
          <>
            <h3 className="mt-1.5 font-display text-2xl font-semibold leading-tight text-white">Work with a mentor</h3>
            <p className="mt-1.5 text-sm text-white/70">
              {match?.status === 'declined'
                ? `${match.mentor?.full_name ?? 'That mentor'} couldn’t take you on this time — ask someone else.`
                : 'Choose a mentor. They see your aptitude report and agree to work with you.'}
            </p>
            {!mentors && (
              <button
                type="button"
                onClick={() => void openPicker()}
                className="press mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 shadow-e2 hover:bg-brand-50"
              >
                <Users size={16} /> Find a mentor
              </button>
            )}
          </>
        )}

        {error && (
          <div className="mt-4">
            <Alert tone="danger" title="Something went wrong">
              <p>{error}</p>
            </Alert>
          </div>
        )}
      </div>

      {/* The mentor list, on a light panel so profiles are easy to read. */}
      {aptitudeDone && !open && mentors && (
        <div className="relative mt-5 rounded-xl bg-white p-4">
          {mentors.length === 0 ? (
            <p className="text-sm text-ink-600">No mentors are taking students yet — check back soon.</p>
          ) : picked ? (
            <div>
              <p className="text-sm font-semibold text-ink-900">Ask {picked.full_name}</p>
              <div className="mt-2">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  required={false}
                  aria-label="What would you like help with?"
                  placeholder="What would you like help with? e.g. I want to get better at running Google Ads."
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  icon={UserCheck}
                  disabled={busy}
                  onClick={() => void run(() => requestMentor(programme, picked.id, note))}
                >
                  {busy ? 'Sending…' : 'Send request'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPicked(null)}>
                  Back
                </Button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {mentors.map((m) => (
                <li key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar name={m.full_name} src={m.avatar_url ?? undefined} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">{m.full_name}</p>
                    <p className="truncate text-xs text-ink-500">{m.headline}</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => setPicked(m)}>
                    Ask
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
