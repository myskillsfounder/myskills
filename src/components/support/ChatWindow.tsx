import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { ArrowDown, Check, CheckCheck, Loader2, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  fetchMessages,
  getSession,
  heartbeatSession,
  markRead,
  peerIsOnline,
  peerIsTyping,
  setTyping,
  sendMessage,
  type SupportMessage,
} from '@/lib/support'

interface UiMessage extends SupportMessage {
  pending?: boolean
}

const POLL_MS = 2500
const TYPING_TTL = 2500

function dayLabel(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const yest = new Date(Date.now() - 864e5)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yest.toDateString()) return 'Yesterday'
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

/**
 * Live chat with three delivery paths so messages never stall:
 *   1. broadcast  — instant peer-to-peer over the websocket (works even when
 *      postgres_changes/replication isn't wired up on self-hosted Supabase)
 *   2. postgres_changes — authoritative DB events when available
 *   3. polling — a 2.5s safety net so it always converges
 * Sends are optimistic, so your own message appears immediately.
 */
export function ChatWindow({
  sessionId,
  meId,
  peerName,
  disabled,
}: {
  sessionId: string
  meId: string
  peerName: string
  disabled?: boolean
}) {
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [peerTyping, setPeerTyping] = useState(false)
  const [peerOnline, setPeerOnline] = useState(false)
  const [atBottom, setAtBottom] = useState(true)

  const scrollRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const lastAtRef = useRef<string>(new Date(0).toISOString())
  const typingTimer = useRef<number | null>(null)
  const sentTypingAt = useRef(0)
  const sessionRef = useRef<import('@/lib/support').SupportSession | null>(null)

  /** Merge new rows, dropping optimistic twins and duplicates. */
  const merge = useCallback((incoming: SupportMessage[]) => {
    if (incoming.length === 0) return
    setMessages((prev) => {
      const byId = new Map(prev.map((m) => [m.id, m]))
      for (const m of incoming) byId.set(m.id, m)
      const real = [...byId.values()].filter((m) => !m.pending)
      const pending = prev.filter(
        (m) => m.pending && !real.some((r) => r.sender_id === m.sender_id && r.body === m.body),
      )
      const all = [...real, ...pending].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )
      const newest = real.at(-1)?.created_at
      if (newest && newest > lastAtRef.current) lastAtRef.current = newest
      const sig = (xs: UiMessage[]) => xs.map((m) => `${m.id}:${m.read_at ?? ''}:${m.pending ? 1 : 0}`).join('|')
      return sig(all) === sig(prev) ? prev : all
    })
  }, [])

  // Initial load
  useEffect(() => {
    let active = true
    setLoading(true)
    void fetchMessages(sessionId).then((m) => {
      if (!active) return
      setMessages(m)
      if (m.length) lastAtRef.current = m[m.length - 1].created_at
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [sessionId])

  // Realtime: broadcast + postgres_changes + presence on one channel
  useEffect(() => {
    const ch = supabase.channel(`chat:${sessionId}`, {
      config: { broadcast: { self: false }, presence: { key: meId } },
    })

    ch.on('broadcast', { event: 'msg' }, ({ payload }) => merge([payload as SupportMessage]))
      .on('broadcast', { event: 'read' }, ({ payload }) => {
        // peer read my messages -> flip the ticks instantly
        if ((payload as { from: string }).from === meId) return
        setMessages((prev) =>
          prev.map((m) => (m.sender_id === meId && !m.read_at ? { ...m, read_at: new Date().toISOString() } : m)),
        )
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if ((payload as { from: string }).from === meId) return
        setPeerTyping(true)
        if (typingTimer.current) window.clearTimeout(typingTimer.current)
        typingTimer.current = window.setTimeout(() => setPeerTyping(false), TYPING_TTL)
      })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `session_id=eq.${sessionId}` },
        (payload) => merge([payload.new as SupportMessage]),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'support_messages', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const u = payload.new as SupportMessage
          setMessages((prev) => prev.map((m) => (m.id === u.id ? { ...m, read_at: u.read_at } : m)))
        },
      )
      .on('presence', { event: 'sync' }, () => {
        const others = Object.keys(ch.presenceState()).filter((k) => k !== meId)
        setPeerOnline(others.length > 0)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') void ch.track({ at: Date.now() })
      })

    channelRef.current = ch
    return () => {
      channelRef.current = null
      void supabase.removeChannel(ch)
    }
  }, [sessionId, meId, merge])

  // Polling safety net — refetch the WHOLE thread so we also pick up read_at
  // updates (a "since" query would never see receipts on older messages).
  useEffect(() => {
    const tick = () => void fetchMessages(sessionId).then(merge).catch(() => {})
    const id = window.setInterval(tick, POLL_MS)
    return () => window.clearInterval(id)
  }, [sessionId, merge])

  // DB-driven presence + typing: read the peer's stamps and refresh my own.
  // Works even when realtime websockets aren't available.
  useEffect(() => {
    if (disabled) return
    let active = true
    let beats = 0
    const tick = async () => {
      try {
        const fresh = await getSession(sessionId)
        if (!active || !fresh) return
        sessionRef.current = fresh
        setPeerOnline(peerIsOnline(fresh, meId))
        setPeerTyping(peerIsTyping(fresh, meId))
        // heartbeat every other tick (~5s) while the tab is visible
        if (document.visibilityState === 'visible' && beats++ % 2 === 0) {
          await heartbeatSession(sessionId, meId, fresh)
        }
      } catch {
        /* ignore */
      }
    }
    void tick()
    const id = window.setInterval(tick, 2500)
    return () => {
      active = false
      window.clearInterval(id)
    }
  }, [sessionId, meId, disabled])

  // Auto-scroll when already at the bottom
  useEffect(() => {
    if (atBottom) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, peerTyping, atBottom])

  // Read receipts: stamp anything I received while the chat is on screen,
  // then tell the sender straight away over broadcast.
  useEffect(() => {
    if (disabled || document.visibilityState !== 'visible') return
    const unread = messages.some((m) => m.sender_id !== meId && !m.read_at && !m.pending)
    if (!unread) return
    let active = true
    void markRead(sessionId, meId).then((ids) => {
      if (!active || ids.length === 0) return
      setMessages((prev) =>
        prev.map((m) => (ids.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m)),
      )
      void channelRef.current?.send({ type: 'broadcast', event: 'read', payload: { from: meId } })
    })
    return () => {
      active = false
    }
  }, [messages, sessionId, meId, disabled])

  function onScroll() {
    const el = scrollRef.current
    if (!el) return
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80)
  }

  function onType(v: string) {
    setText(v)
    const now = Date.now()
    if (now - sentTypingAt.current > 2000) {
      sentTypingAt.current = now
      // instant path (websocket) + durable path (DB poll) so it always shows
      void channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { from: meId } })
      const sess = sessionRef.current
      if (sess) void setTyping(sessionId, meId, sess).catch(() => {})
    }
  }

  async function submit(e?: React.FormEvent) {
    e?.preventDefault()
    const body = text.trim()
    if (!body || disabled) return
    setText('')

    const temp: UiMessage = {
      id: `temp-${crypto.randomUUID()}`,
      session_id: sessionId,
      sender_id: meId,
      body,
      created_at: new Date().toISOString(),
      pending: true,
    }
    setMessages((p) => [...p, temp])
    setAtBottom(true)

    try {
      const saved = await sendMessage(sessionId, body)
      merge([saved])
      // Push straight to the peer — instant even if DB replication events lag.
      void channelRef.current?.send({ type: 'broadcast', event: 'msg', payload: saved })
    } catch {
      setMessages((p) => p.filter((m) => m.id !== temp.id))
      setText(body)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void submit()
    }
  }

  let lastDay = ''

  return (
    <div className="flex h-[62vh] flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white">
      {/* header */}
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${peerOnline ? 'bg-emerald-500' : 'bg-ink-300'}`} />
          <span className="text-sm font-medium text-ink-800">{peerName}</span>
          <span className="text-xs text-ink-400">{peerOnline ? 'online' : 'offline'}</span>
        </div>
        {peerTyping && <span className="text-xs italic text-brand-600">typing…</span>}
      </div>

      {/* messages */}
      <div ref={scrollRef} onScroll={onScroll} className="relative flex-1 space-y-1.5 overflow-y-auto bg-ink-50/40 p-4">
        {loading && (
          <p className="flex items-center justify-center gap-2 py-6 text-xs text-ink-400">
            <Loader2 size={13} className="animate-spin" /> Loading conversation…
          </p>
        )}
        {!loading && messages.length === 0 && (
          <p className="py-8 text-center text-xs text-ink-400">
            You’re connected with {peerName}. Say hello 👋
          </p>
        )}

        {messages.map((m) => {
          const mine = m.sender_id === meId
          const day = dayLabel(m.created_at)
          const showDay = day !== lastDay
          lastDay = day
          return (
            <div key={m.id}>
              {showDay && (
                <div className="my-3 flex justify-center">
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-medium text-ink-400 shadow-sm">
                    {day}
                  </span>
                </div>
              )}
              <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                    mine
                      ? `rounded-br-md bg-brand-600 text-white ${m.pending ? 'opacity-70' : ''}`
                      : 'rounded-bl-md bg-white text-ink-800'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words leading-relaxed">{m.body}</p>
                  <p className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${mine ? 'text-white/70' : 'text-ink-400'}`}>
                    {time(m.created_at)}
                    {mine &&
                      (m.pending ? (
                        <Loader2 size={9} className="animate-spin" />
                      ) : m.read_at ? (
                        <CheckCheck size={11} className="text-sky-200" />
                      ) : (
                        <Check size={10} />
                      ))}
                  </p>
                </div>
              </div>
            </div>
          )
        })}

        {peerTyping && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl rounded-bl-md bg-white px-3 py-2.5 shadow-sm">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {!atBottom && (
        <button
          type="button"
          onClick={() => {
            setAtBottom(true)
            endRef.current?.scrollIntoView({ behavior: 'smooth' })
          }}
          className="absolute bottom-24 left-1/2 z-10 -translate-x-1/2 rounded-full bg-brand-600 p-2 text-white shadow-lg"
          aria-label="Jump to latest"
        >
          <ArrowDown size={15} />
        </button>
      )}

      {/* composer */}
      <form onSubmit={submit} className="flex items-end gap-2 border-t border-ink-100 bg-white p-3">
        <textarea
          value={text}
          onChange={(e) => onType(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          rows={1}
          placeholder={disabled ? 'This chat has ended.' : 'Message… (Enter to send)'}
          className="max-h-28 min-h-[40px] min-w-0 flex-1 resize-none rounded-2xl border border-ink-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:bg-ink-50"
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:opacity-40"
          aria-label="Send"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
