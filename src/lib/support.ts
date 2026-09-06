/**
 * Live mentor support chat. See docs/supabase-support-chat.sql.
 *
 * Lifecycle: user submits an intake (topic + details) -> session enters the
 * queue as `waiting` -> a mentor claims it (`active`) -> either side ends it
 * (`ended`), which DELETES the messages. Stale sessions expire via
 * cleanup_support().
 */
import { supabase } from './supabase'

export type SessionStatus = 'waiting' | 'active' | 'ended' | 'cancelled'

export interface SupportSession {
  id: string
  user_id: string
  mentor_id: string | null
  topic: string
  details: string
  status: SessionStatus
  created_at: string
  started_at: string | null
  ended_at: string | null
  /** heartbeat stamps used for presence without websockets */
  user_seen_at?: string | null
  mentor_seen_at?: string | null
  /** stamps used for the typing indicator without websockets */
  user_typing_at?: string | null
  mentor_typing_at?: string | null
  /** the learner's "was this helpful?" rating, set once via rateSession() */
  helpful?: boolean | null
  helpful_at?: string | null
}

export interface SupportMessage {
  id: string
  session_id: string
  sender_id: string
  body: string
  created_at: string
  /** set when the recipient has seen it (read receipts) */
  read_at?: string | null
}

export const SUPPORT_TOPICS = [
  'Career guidance',
  'Digital marketing help',
  'Assessment / practice doubt',
  'Portfolio & resume',
  'Something else',
]

/** Is any mentor online right now? Returns the online mentor ids. */
export async function fetchOnlineMentors(): Promise<string[]> {
  const { data } = await supabase
    .from('mentor_presence')
    .select('mentor_id, is_online, last_seen')
    .eq('is_online', true)
  const fresh = (data ?? []).filter(
    (m: { last_seen: string }) => Date.now() - new Date(m.last_seen).getTime() < 2 * 60_000,
  )
  return fresh.map((m: { mentor_id: string }) => m.mentor_id)
}

export interface OnlineMentor {
  id: string
  name: string
  avatar_url: string | null
  headline: string | null
}

/**
 * Same freshness check as fetchOnlineMentors, but with enough to actually show
 * a person — name, photo, headline — instead of just a count. Waiting for
 * "a mentor" is abstract; waiting for Priya is concrete.
 */
export async function fetchOnlineMentorProfiles(): Promise<OnlineMentor[]> {
  const { data, error } = await supabase
    .from('mentor_presence')
    .select('mentor_id, last_seen, profiles(full_name, avatar_url, headline)')
    .eq('is_online', true)
  if (error) return []
  type Row = {
    mentor_id: string
    last_seen: string
    profiles: { full_name: string | null; avatar_url: string | null; headline: string | null } | null
  }
  const fresh = (data as unknown as Row[]).filter(
    (m) => Date.now() - new Date(m.last_seen).getTime() < 2 * 60_000,
  )
  return fresh.map((m) => ({
    id: m.mentor_id,
    name: m.profiles?.full_name?.trim() || 'A mentor',
    avatar_url: m.profiles?.avatar_url ?? null,
    headline: m.profiles?.headline ?? null,
  }))
}

/** Create a help request (goes to the back of the queue). */
export async function createSession(topic: string, details: string): Promise<SupportSession> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('You are not signed in.')

  // Reuse an existing open session instead of stacking duplicates.
  const { data: open } = await supabase
    .from('support_sessions')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['waiting', 'active'])
    .maybeSingle()
  if (open) return open as SupportSession

  const { data, error } = await supabase
    .from('support_sessions')
    .insert({ user_id: user.id, topic, details })
    .select('*')
    .single()
  if (error) throw error
  const session = data as SupportSession

  // Post the learner's own intake as a real message, not just metadata on the
  // session row -- otherwise the mentor only ever sees a paraphrase in the
  // greeting, never what the learner actually typed.
  try {
    await supabase
      .from('support_messages')
      .insert({ session_id: session.id, sender_id: user.id, body: details.trim() })
  } catch {
    /* the session still works without this; never block on it */
  }

  return session
}

export async function fetchMySession(): Promise<SupportSession | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('support_sessions')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['waiting', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as SupportSession) ?? null
}

export async function getSession(id: string): Promise<SupportSession | null> {
  const { data } = await supabase.from('support_sessions').select('*').eq('id', id).maybeSingle()
  return (data as SupportSession) ?? null
}

/** 1-based position in the waiting queue (1 = next up). */
export async function queuePosition(session: SupportSession): Promise<number> {
  const { count } = await supabase
    .from('support_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'waiting')
    .lte('created_at', session.created_at)
  return count ?? 1
}

/** Mentor: everyone currently waiting, oldest first. */
export async function fetchQueue(): Promise<SupportSession[]> {
  const { data, error } = await supabase
    .from('support_sessions')
    .select('*')
    .eq('status', 'waiting')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as SupportSession[]
}

/** Mentor: sessions this mentor is currently handling. */
export async function fetchMyActiveAsMentor(): Promise<SupportSession[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from('support_sessions')
    .select('*')
    .eq('mentor_id', user.id)
    .eq('status', 'active')
    .order('started_at', { ascending: true })
  return (data ?? []) as SupportSession[]
}

/** Mentor claims a waiting session. Guarded so two mentors can't double-claim. */
export async function claimSession(id: string): Promise<SupportSession | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('You are not signed in.')
  const { data, error } = await supabase
    .from('support_sessions')
    .update({ mentor_id: user.id, status: 'active', started_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'waiting')
    .select('*')
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  const session = data as SupportSession
  // Open the conversation for the learner instead of dropping them into a
  // blank chat — a greeting written around what they asked for.
  try {
    const names = await fetchNames([session.user_id, user.id])
    const opening = greetingFor(
      session.topic,
      names[session.user_id] ?? 'Learner',
      names[user.id] ?? 'your mentor',
    )
    const saved = await sendMessage(session.id, opening)
    await announceMessage(session.id, saved)
  } catch {
    /* a failed greeting must never block the claim */
  }

  await announceSessionChange(id)
  return session
}

export async function cancelSession(id: string): Promise<void> {
  await supabase
    .from('support_sessions')
    .update({ status: 'cancelled', ended_at: new Date().toISOString() })
    .eq('id', id)
}

/** End a chat — deletes all its messages (server-side RPC). */
export async function endSession(id: string): Promise<void> {
  const { error } = await supabase.rpc('end_support_session', { p_session: id })
  if (error) throw error
  await announceSessionChange(id)
}

/** Learner rates a just-ended chat. Server-side RPC so a plain row-level
 *  update grant can't be used to touch other columns on the session. */
export async function rateSession(id: string, helpful: boolean): Promise<void> {
  const { error } = await supabase.rpc('rate_support_session', { p_session: id, p_helpful: helpful })
  if (error) throw error
}

export async function fetchMessages(sessionId: string): Promise<SupportMessage[]> {
  const { data, error } = await supabase
    .from('support_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as SupportMessage[]
}

export async function sendMessage(sessionId: string, body: string): Promise<SupportMessage> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('You are not signed in.')
  const { data, error } = await supabase
    .from('support_messages')
    .insert({ session_id: sessionId, sender_id: user.id, body: body.trim() })
    .select('*')
    .single()
  if (error) throw error
  return data as SupportMessage
}

/** Messages newer than `since` (polling fallback when realtime is unavailable). */
export async function fetchMessagesSince(sessionId: string, since: string): Promise<SupportMessage[]> {
  const { data, error } = await supabase
    .from('support_messages')
    .select('*')
    .eq('session_id', sessionId)
    .gt('created_at', since)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as SupportMessage[]
}

/** The mentor's opening line, tailored to what the learner asked for. */
/**
 * The mentor's opening line. Deliberately short: the learner's own intake
 * message now appears in the thread itself (see createSession), so this
 * greeting just needs to say hello and pick up the conversation -- restating
 * their question back to them a second time would read as redundant.
 */
export function greetingFor(topic: string, learnerName: string, mentorName: string): string {
  const who = learnerName && learnerName !== 'Learner' ? learnerName : 'there'
  const byTopic: Record<string, string> = {
    'Career guidance': 'Thanks for the context — let’s dig into your career guidance question.',
    'Digital marketing help': 'Got it, thanks for sharing that. Let’s work through it together.',
    'Assessment / practice doubt': 'Thanks — let’s work through that one together.',
    'Portfolio & resume': 'Thanks for sharing that. Let’s take a look together.',
    'Something else': 'Thanks for sharing that — let’s take it from here.',
  }
  const follow = byTopic[topic] ?? byTopic['Something else']
  return `Hi ${who}, I’m ${mentorName}. ${follow}`
}

export interface ProfileCard {
  name: string
  avatar_url: string | null
  headline: string | null
}

/** Name + photo + headline for a chat header (RLS: only your session peers,
 *  or any public mentor profile). */
export async function fetchProfileCards(ids: string[]): Promise<Record<string, ProfileCard>> {
  const unique = [...new Set(ids.filter(Boolean))]
  if (unique.length === 0) return {}
  const { data } = await supabase.from('profiles').select('id, full_name, avatar_url, headline').in('id', unique)
  const out: Record<string, ProfileCard> = {}
  for (const r of (data ?? []) as {
    id: string
    full_name: string | null
    avatar_url: string | null
    headline: string | null
  }[]) {
    out[r.id] = { name: r.full_name?.trim() || 'there', avatar_url: r.avatar_url, headline: r.headline }
  }
  return out
}

/** Display names for chat participants (RLS: only your session peers). */
export async function fetchNames(ids: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))]
  if (unique.length === 0) return {}
  const { data } = await supabase.from('profiles').select('id, full_name').in('id', unique)
  const out: Record<string, string> = {}
  for (const r of (data ?? []) as { id: string; full_name: string | null }[]) {
    if (r.full_name?.trim()) out[r.id] = r.full_name.trim()
  }
  return out
}

/** Stamp my "still here" heartbeat on the session (DB-based presence). */
export async function heartbeatSession(sessionId: string, meId: string, session: SupportSession) {
  const col = session.mentor_id === meId ? 'mentor_seen_at' : 'user_seen_at'
  await supabase
    .from('support_sessions')
    .update({ [col]: new Date().toISOString() })
    .eq('id', sessionId)
}

/** Tell the peer I'm typing (throttle calls at the caller — ~1 per 2s). */
export async function setTyping(sessionId: string, meId: string, session: SupportSession) {
  const col = session.mentor_id === meId ? 'mentor_typing_at' : 'user_typing_at'
  await supabase
    .from('support_sessions')
    .update({ [col]: new Date().toISOString() })
    .eq('id', sessionId)
}

/** Is the OTHER participant typing right now? (stamp within 5s) */
export function peerIsTyping(session: SupportSession, meId: string): boolean {
  const stamp = session.mentor_id === meId ? session.user_typing_at : session.mentor_typing_at
  if (!stamp) return false
  return Date.now() - new Date(stamp).getTime() < 5_000
}

/** Is the OTHER participant currently active? (fresh heartbeat within 45s) */
export function peerIsOnline(session: SupportSession, meId: string): boolean {
  const peerStamp = session.mentor_id === meId ? session.user_seen_at : session.mentor_seen_at
  if (!peerStamp) return false
  return Date.now() - new Date(peerStamp).getTime() < 45_000
}

/** Mark every message I received in this session as read. Returns their ids. */
export async function markRead(sessionId: string, meId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('support_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('session_id', sessionId)
    .neq('sender_id', meId)
    .is('read_at', null)
    .select('id')
  if (error) return []
  return (data ?? []).map((r: { id: string }) => r.id)
}

/** Realtime: new messages in a session. */
export function subscribeMessages(sessionId: string, onInsert: (m: SupportMessage) => void) {
  const ch = supabase
    .channel(`support_messages:${sessionId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `session_id=eq.${sessionId}` },
      (payload) => onInsert(payload.new as SupportMessage),
    )
    .subscribe()
  return () => {
    void supabase.removeChannel(ch)
  }
}

/** Push a message to the peer over broadcast (instant, no replication needed). */
export async function announceMessage(sessionId: string, message: SupportMessage): Promise<void> {
  try {
    const ch = supabase.channel(`chat:${sessionId}`)
    await new Promise<void>((resolve) => {
      const t = window.setTimeout(resolve, 1200)
      ch.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          window.clearTimeout(t)
          resolve()
        }
      })
    })
    await ch.send({ type: 'broadcast', event: 'msg', payload: message })
    window.setTimeout(() => void supabase.removeChannel(ch), 500)
  } catch {
    /* best-effort */
  }
}

/** Fire-and-forget: tell both sides this session changed (claimed/ended). */
export async function announceSessionChange(sessionId: string): Promise<void> {
  try {
    const ch = supabase.channel(`session:${sessionId}`)
    await new Promise<void>((resolve) => {
      const t = window.setTimeout(resolve, 1500)
      ch.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          window.clearTimeout(t)
          resolve()
        }
      })
    })
    await ch.send({ type: 'broadcast', event: 'changed', payload: { id: sessionId } })
    window.setTimeout(() => void supabase.removeChannel(ch), 500)
  } catch {
    /* best-effort */
  }
}

/** Listen for those lifecycle announcements. */
export function subscribeSessionBroadcast(sessionId: string, onChange: () => void) {
  const ch = supabase
    .channel(`session:${sessionId}`)
    .on('broadcast', { event: 'changed' }, () => onChange())
    .subscribe()
  return () => {
    void supabase.removeChannel(ch)
  }
}

/** Realtime: any change to a session row (claimed, ended…). */
export function subscribeSession(sessionId: string, onChange: (s: SupportSession) => void) {
  const ch = supabase
    .channel(`support_session:${sessionId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'support_sessions', filter: `id=eq.${sessionId}` },
      (payload) => onChange(payload.new as SupportSession),
    )
    .subscribe()
  return () => {
    void supabase.removeChannel(ch)
  }
}

/** Realtime: the mentor's queue (any new/changed waiting session). */
export function subscribeQueue(onChange: () => void) {
  const ch = supabase
    .channel('support_queue')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'support_sessions' }, () => onChange())
    .subscribe()
  return () => {
    void supabase.removeChannel(ch)
  }
}

/** Is the signed-in account flagged as a mentor? Drives the RLS that exposes
 * the waiting queue — if this is false the queue will always look empty. */
export async function amIMentor(): Promise<{ id: string | null; isMentor: boolean; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { id: null, isMentor: false, error: 'not signed in' }
  const { data, error } = await supabase
    .from('profiles')
    .select('id, is_mentor')
    .eq('id', user.id)
    .maybeSingle()
  if (error) return { id: user.id, isMentor: false, error: error.message }
  return { id: user.id, isMentor: Boolean((data as { is_mentor?: boolean } | null)?.is_mentor) }
}

/** Mentor presence heartbeat. Returns a stop() that marks them offline. */
export async function goOnline(): Promise<() => Promise<void>> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('You are not signed in.')

  const beat = async (online: boolean) => {
    await supabase
      .from('mentor_presence')
      .upsert({ mentor_id: user.id, is_online: online, last_seen: new Date().toISOString() })
  }
  await beat(true)
  const id = window.setInterval(() => void beat(true), 45_000)
  return async () => {
    window.clearInterval(id)
    await beat(false)
  }
}
