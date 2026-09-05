import { useEffect, useRef, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Bell, Circle, Clock, Loader2, Lock, MessageSquare, Power, RefreshCw } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { useAuthUser } from '@/lib/useAuth'
import {
  amIMentor,
  claimSession,
  fetchNames,
  endSession,
  fetchMyActiveAsMentor,
  fetchQueue,
  goOnline,
  subscribeQueue,
  type SupportSession,
} from '@/lib/support'
import { AppShell } from '@/components/app/AppShell'
import { ChatWindow } from '@/components/support/ChatWindow'

export const Route = createFileRoute('/mentor')({
  beforeLoad: requireOnboarded,
  component: MentorConsole,
})

/** Short "ding" so the mentor notices a new request without staring at the tab. */
function ding() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
  } catch {
    /* ignore */
  }
}

function MentorConsole() {
  const { user } = useAuthUser()
  const [online, setOnline] = useState(false)
  const [queue, setQueue] = useState<SupportSession[]>([])
  const [active, setActive] = useState<SupportSession[]>([])
  const [open, setOpen] = useState<SupportSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [mentorCheck, setMentorCheck] = useState<{ isMentor: boolean; id: string | null } | null>(null)
  const [names, setNames] = useState<Record<string, string>>({})
  const stopRef = useRef<null | (() => Promise<void>)>(null)
  const prevQueue = useRef(0)

  async function refresh() {
    try {
      const [q, a] = await Promise.all([fetchQueue(), fetchMyActiveAsMentor()])
      void fetchNames([...q, ...a].map((x) => x.user_id)).then((m) =>
        setNames((prev) => ({ ...prev, ...m })),
      )
      setError(undefined)
      setQueue(q)
      setActive(a)
      if (q.length > prevQueue.current) {
        ding()
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New mentor request', { body: q[q.length - 1]?.topic ?? 'A learner needs help' })
        }
      }
      prevQueue.current = q.length
    } catch (e) {
      // Most often: this account isn't flagged is_mentor, so RLS hides the queue.
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  // Verify mentor access first; only then start polling/subscribing.
  useEffect(() => {
    let cancelled = false
    void amIMentor().then((r) => {
      if (!cancelled) setMentorCheck({ isMentor: r.isMentor, id: r.id })
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!mentorCheck?.isMentor) return
    void refresh()
    const unsub = subscribeQueue(() => void refresh())
    const poll = window.setInterval(() => void refresh(), 5_000)
    return () => {
      unsub()
      window.clearInterval(poll)
      void stopRef.current?.()
    }
  }, [mentorCheck?.isMentor])

  async function toggleOnline() {
    setError(undefined)
    try {
      if (online) {
        await stopRef.current?.()
        stopRef.current = null
        setOnline(false)
        return
      }
      if ('Notification' in window && Notification.permission === 'default') {
        void Notification.requestPermission()
      }
      stopRef.current = await goOnline()
      setOnline(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  async function claim(s: SupportSession) {
    setError(undefined)
    try {
      const claimed = await claimSession(s.id)
      if (claimed) {
        setOpen(claimed)
        await refresh()
      } else {
        await refresh() // someone else got it
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  async function finish(s: SupportSession) {
    setError(undefined)
    try {
      await endSession(s.id)
      setOpen(null)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const nameOf = (s: SupportSession) => names[s.user_id] ?? 'Learner'

  const waited = (iso: string) => {
    const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
    return m < 1 ? 'just now' : `${m} min`
  }

  // Still verifying access
  if (!mentorCheck) {
    return (
      <AppShell wide>
        <p className="flex items-center gap-2 py-10 text-sm text-ink-600">
          <Loader2 size={15} className="animate-spin" /> Loading…
        </p>
      </AppShell>
    )
  }

  // Not a mentor: show nothing about the queue, the account, or how access works.
  if (!mentorCheck.isMentor) {
    return (
      <AppShell wide>
        <div className="mx-auto max-w-md card p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ink-200 text-ink-500">
            <Lock size={22} />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-ink-900">Mentors only</h1>
          <p className="mt-1.5 text-sm text-ink-600">
            This area is for MySkills mentors. If you’d like to talk to one, start a chat from your
            dashboard.
          </p>
          <Link
            to="/support"
            className="mt-5 inline-flex items-center rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Talk to a mentor
          </Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell wide>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">Mentor console</h1>
          <p className="mt-0.5 text-sm text-ink-600">Go online to receive learner requests.</p>
        </div>
        <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink-300 bg-white px-3.5 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-100"
          title="Refresh queue"
        >
          <RefreshCw size={15} /> Refresh
        </button>
        <button
          type="button"
          onClick={toggleOnline}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
            online ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'border border-ink-300 bg-white text-ink-800 hover:bg-ink-100'
          }`}
        >
          <Power size={15} />
          {online ? 'Online — accepting chats' : 'Go online'}
        </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Couldn’t load the queue.</p>
          <p className="mt-1">{error}</p>
          <p className="mt-2 text-red-600">
            Make sure this account is flagged as a mentor (run
            <code className="mx-1 rounded bg-red-100 px-1">docs/supabase-mentors.sql</code>)
            and that <code className="rounded bg-red-100 px-1">docs/supabase-support-chat.sql</code> has been applied.
          </p>
        </div>
      )}

      {open ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 card px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink-900">{nameOf(open)}</p>
              <p className="text-xs font-medium text-brand-600">{open.topic}</p>
              <p className="text-xs text-ink-600">{open.details}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen(null)} className="rounded-full border border-ink-300 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-100">
                Back to queue
              </button>
              <button type="button" onClick={() => finish(open)} className="rounded-full bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600">
                End chat
              </button>
            </div>
          </div>
          {user && <ChatWindow sessionId={open.id} meId={user.id} peerName={nameOf(open)} />}
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Queue */}
          <section>
            <h2 className="mb-3 inline-flex items-center gap-2 text-base font-semibold text-ink-900">
              <Bell size={16} className="text-brand-600" /> Waiting ({queue.length})
            </h2>
            {loading ? (
              <p className="flex items-center gap-2 text-sm text-ink-600"><Loader2 size={15} className="animate-spin" /> Loading…</p>
            ) : queue.length === 0 ? (
              <div className="card border-dashed p-8 text-center text-sm text-ink-600">
                No one waiting right now.
              </div>
            ) : (
              <ul className="space-y-2.5">
                {queue.map((s) => (
                  <li key={s.id} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700">
                            {nameOf(s).charAt(0).toUpperCase()}
                          </span>
                          <p className="truncate text-sm font-semibold text-ink-900">{nameOf(s)}</p>
                        </div>
                        <p className="mt-1 text-xs font-medium text-brand-600">{s.topic}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-ink-600">{s.details}</p>
                        <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-ink-500">
                          <Clock size={11} /> waiting {waited(s.created_at)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => claim(s)}
                        className="shrink-0 rounded-full bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                      >
                        Accept
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Active */}
          <section>
            <h2 className="mb-3 inline-flex items-center gap-2 text-base font-semibold text-ink-900">
              <MessageSquare size={16} className="text-emerald-600" /> Your chats ({active.length})
            </h2>
            {active.length === 0 ? (
              <div className="card border-dashed p-8 text-center text-sm text-ink-600">
                No active chats.
              </div>
            ) : (
              <ul className="space-y-2.5">
                {active.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setOpen(s)}
                      className="flex w-full items-center justify-between gap-3 card p-4 text-left hover:border-brand-200"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink-900">{nameOf(s)}</p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-ink-600">{s.topic}</p>
                      </div>
                      <Circle size={9} className="shrink-0 fill-emerald-500 text-emerald-500" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </AppShell>
  )
}
