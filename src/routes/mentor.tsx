import { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Bell, Circle, Clock, Loader2, MessageSquare, Power, RefreshCw } from 'lucide-react'
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
      console.log('[mentor] queue:', q.length, 'active:', a.length)
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

  useEffect(() => {
    void amIMentor().then((r) => {
      console.log('[mentor] account check →', r)
      setMentorCheck({ isMentor: r.isMentor, id: r.id })
    })
    void refresh()
    const unsub = subscribeQueue(() => void refresh())
    const poll = window.setInterval(() => void refresh(), 5_000)
    return () => {
      unsub()
      window.clearInterval(poll)
      void stopRef.current?.()
    }
  }, [])

  async function toggleOnline() {
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
  }

  async function claim(s: SupportSession) {
    const claimed = await claimSession(s.id)
    if (claimed) {
      setOpen(claimed)
      await refresh()
    } else {
      await refresh() // someone else got it
    }
  }

  async function finish(s: SupportSession) {
    await endSession(s.id)
    setOpen(null)
    await refresh()
  }

  const nameOf = (s: SupportSession) => names[s.user_id] ?? 'Learner'

  const waited = (iso: string) => {
    const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
    return m < 1 ? 'just now' : `${m} min`
  }

  return (
    <AppShell wide>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink-900">Mentor console</h1>
          <p className="mt-0.5 text-sm text-ink-500">Go online to receive learner requests.</p>
        </div>
        <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3.5 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-50"
          title="Refresh queue"
        >
          <RefreshCw size={15} /> Refresh
        </button>
        <button
          type="button"
          onClick={toggleOnline}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
            online ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'border border-ink-200 bg-white text-ink-700 hover:bg-ink-50'
          }`}
        >
          <Power size={15} />
          {online ? 'Online — accepting chats' : 'Go online'}
        </button>
        </div>
      </div>

      {mentorCheck && !mentorCheck.isMentor && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">This account is not flagged as a mentor.</p>
          <p className="mt-1">
            Row-level security only shows the waiting queue to mentors, so it will always look empty.
          </p>
          <p className="mt-2 break-all text-xs text-amber-700">
            Run in Supabase:{' '}
            <code className="rounded bg-amber-100 px-1">
              update public.profiles set is_mentor = true where id = '{mentorCheck.id}';
            </code>
          </p>
        </div>
      )}

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
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-ink-100 bg-white px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink-900">{nameOf(open)}</p>
              <p className="text-xs font-medium text-brand-600">{open.topic}</p>
              <p className="text-xs text-ink-500">{open.details}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen(null)} className="rounded-full border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50">
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
              <p className="flex items-center gap-2 text-sm text-ink-500"><Loader2 size={15} className="animate-spin" /> Loading…</p>
            ) : queue.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center text-sm text-ink-500">
                No one waiting right now.
              </div>
            ) : (
              <ul className="space-y-2.5">
                {queue.map((s) => (
                  <li key={s.id} className="rounded-2xl border border-ink-100 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700">
                            {nameOf(s).charAt(0).toUpperCase()}
                          </span>
                          <p className="truncate text-sm font-semibold text-ink-900">{nameOf(s)}</p>
                        </div>
                        <p className="mt-1 text-xs font-medium text-brand-600">{s.topic}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-ink-500">{s.details}</p>
                        <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-ink-400">
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
              <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center text-sm text-ink-500">
                No active chats.
              </div>
            ) : (
              <ul className="space-y-2.5">
                {active.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setOpen(s)}
                      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-ink-100 bg-white p-4 text-left hover:border-brand-200"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink-900">{nameOf(s)}</p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-ink-500">{s.topic}</p>
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
