import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Clock, Loader2, MessageSquare, MessagesSquare, X } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { useAuthUser, userDisplayName } from '@/lib/useAuth'
import {
  cancelSession,
  createSession,
  endSession,
  fetchMySession,
  fetchNames,
  fetchOnlineMentors,
  getSession,
  queuePosition,
  subscribeSession,
  subscribeSessionBroadcast,
  type SupportSession,
} from '@/lib/support'
import { AppShell } from '@/components/app/AppShell'
import { ChatWindow } from '@/components/support/ChatWindow'
import { BotIntake } from '@/components/support/BotIntake'

export const Route = createFileRoute('/support')({
  beforeLoad: requireOnboarded,
  component: SupportPage,
})

function SupportPage() {
  const { user } = useAuthUser()
  const [session, setSession] = useState<SupportSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState<string[]>([])
  const [position, setPosition] = useState<number | null>(null)

  const [mentorName, setMentorName] = useState('your mentor')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    Promise.all([fetchMySession(), fetchOnlineMentors()])
      .then(([s, o]) => {
        setSession(s)
        setOnline(o)
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [])

  // Live updates for my session (claimed by a mentor, ended, …).
  // Three paths so it never gets stuck on the waiting screen:
  //  1) postgres_changes, 2) a broadcast the mentor fires on claim/end,
  //  3) a short poll as the guaranteed fallback.
  useEffect(() => {
    if (!session) return
    const id = session.id
    const pull = () =>
      void getSession(id).then((fresh) => {
        if (fresh) setSession((cur) => (cur && cur.id === fresh.id && cur.status === fresh.status ? cur : fresh))
      })

    const unsubRow = subscribeSession(id, (s) => setSession(s))
    const unsubCast = subscribeSessionBroadcast(id, pull)
    const poll = window.setInterval(pull, 3000)
    return () => {
      unsubRow()
      unsubCast()
      window.clearInterval(poll)
    }
  }, [session?.id])

  // Resolve the mentor's real name for the chat header
  useEffect(() => {
    if (!session?.mentor_id) return
    void fetchNames([session.mentor_id]).then((m) => {
      const n = m[session.mentor_id as string]
      if (n) setMentorName(n)
    })
  }, [session?.mentor_id])

  // Refresh queue position while waiting
  useEffect(() => {
    if (!session || session.status !== 'waiting') {
      setPosition(null)
      return
    }
    const tick = () => void queuePosition(session).then(setPosition)
    tick()
    const id = window.setInterval(tick, 15_000)
    return () => window.clearInterval(id)
  }, [session?.id, session?.status])

  async function start(topic: string, details: string) {
    setError(undefined)
    setSubmitting(true)
    try {
      setSession(await createSession(topic, details))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSubmitting(false)
    }
  }

  async function leave() {
    if (!session) return
    if (session.status === 'waiting') await cancelSession(session.id)
    else await endSession(session.id)
    setSession(null)
  }

  const mentorsOnline = online.length > 0

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>

        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <MessagesSquare size={22} />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink-900">Talk to a mentor</h1>
            <p className="text-sm text-ink-500">
              {mentorsOnline ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> A mentor is online now
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-ink-300" /> No mentor online — you’ll be queued
                </span>
              )}
            </p>
          </div>
        </div>

        {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {loading && (
          <p className="flex items-center gap-2 text-sm text-ink-500">
            <Loader2 size={15} className="animate-spin" /> Loading…
          </p>
        )}

        {/* 1) Bot intake — collects the problem, then hands off to a mentor */}
        {!loading && !session && (
          <BotIntake
            firstName={userDisplayName(user).split(' ')[0]}
            onConnect={(t, d) => void start(t, d)}
            connecting={submitting}
          />
        )}

        {/* 2) Waiting room */}
        {session?.status === 'waiting' && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
            <Loader2 size={26} className="mx-auto animate-spin text-amber-600" />
            <h2 className="mt-3 text-base font-semibold text-amber-900">Waiting for a mentor…</h2>
            <p className="mt-1 text-sm text-amber-700">
              {position && position > 1 ? `You’re #${position} in the queue.` : 'You’re next in line.'}
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-amber-700">
              <Clock size={12} /> {mentorsOnline ? 'A mentor has been notified.' : 'We’ll connect you as soon as a mentor comes online.'}
            </p>
            <div className="mt-4 rounded-xl bg-white/70 p-3 text-left">
              <p className="text-xs font-semibold text-ink-700">{session.topic}</p>
              <p className="mt-0.5 text-xs text-ink-500">{session.details}</p>
            </div>
            <button
              type="button"
              onClick={leave}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100"
            >
              <X size={13} /> Cancel request
            </button>
          </div>
        )}

        {/* 3) Live chat */}
        {session?.status === 'active' && user && (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Connected with {mentorName}
              </p>
              <button
                type="button"
                onClick={leave}
                className="rounded-full border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                End chat
              </button>
            </div>
            <ChatWindow sessionId={session.id} meId={user.id} peerName={mentorName} />
            <p className="text-center text-xs text-ink-400">
              Ending the chat permanently deletes these messages.
            </p>
          </div>
        )}

        {/* Ended */}
        {session && (session.status === 'ended' || session.status === 'cancelled') && (
          <div className="rounded-2xl border border-ink-200 bg-white p-8 text-center">
            <p className="text-sm font-medium text-ink-800">This session has ended.</p>
            <p className="mt-1 text-xs text-ink-500">The chat messages were deleted.</p>
            <button
              type="button"
              onClick={() => setSession(null)}
              className="mt-4 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Start a new request
            </button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
