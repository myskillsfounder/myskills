import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'

/*
 * Focus Rooms (Paul, 1 Nov 2026): a live study room for each programme a
 * student is in. Camera only, never a microphone; each student says what
 * they are working on; the room posts and upvotes the topics that matter.
 *
 * Who is here travels as Realtime presence on the private channel
 * "focus:<slug>" (docs/supabase-focus-rooms.sql lets only members join).
 * The cameras go student to student over WebRTC, with the same channel's
 * broadcast carrying the handshake. Nothing is recorded or stored.
 */

/** Everyone's room: any signed-in student may enter it, whatever they study
 *  (docs/supabase-study-rooms-open.sql). Study rooms became the app's first
 *  tab on 3 Nov 2026, and a new student has no programme yet. */
export const OPEN_ROOM = 'open'

/** What the Open study room suggests for "What are you working on?". */
export const OPEN_HINTS = ['Revision', 'Homework', 'Exam prep', 'Reading', 'My project']

/** "What I'm working on" fits under a camera tile. */
export const WORKING_ON_MAX = 80

/** A room the student may enter: the Open study room, and one per programme they are in. */
export interface FocusRoom {
  slug: string
  title: string
  /** Topics on the board from the last 14 days. */
  topics: number
}

export interface FocusTopic {
  id: string
  body: string
  created_at: string
  author: string
  mine: boolean
  votes: number
  voted: boolean
  /** Answers so far; missing before docs/supabase-study-rooms-engage.sql is run. */
  replies?: number
  /** Its author marked an answer as the one that solved it. */
  solved?: boolean
}

/** An answer to a doubt. */
export interface FocusReply {
  id: string
  body: string
  created_at: string
  author: string
  avatar: string | null
  mine: boolean
  /** The doubt's author marked this as the answer that solved it. */
  accepted: boolean
}

/** The student's own study time, from focus_my_study(). */
export interface MyStudy {
  today: number
  week: number
  streak: number
}

/** This week's top five in a room. */
export interface RoomLeader {
  name: string
  avatar: string | null
  minutes: number
  mine: boolean
}

/** What each student in the room shares with the others. */
export interface FocusPresence {
  /** One per open tab, so the same student in two tabs is two tiles. */
  session: string
  user_id: string
  name: string
  avatar: string | null
  working_on: string
  camera: boolean
  joined_at: string
  /** Raised hand: they'd like help. Missing from an older tab. */
  hand?: boolean
}

/** A quick cheer, to the whole room or to one student's tile. */
export interface Reaction {
  id: string
  emoji: string
  /** Who sent it. */
  name: string
  /** The session it was for, or null for the room. */
  to: string | null
}

/** The cheers a student can send. */
export const REACTIONS = ['👏', '🔥', '💪', '☕', '🎉'] as const

/** Empty, not an error, before docs/supabase-focus-rooms.sql is run. */
export async function fetchMyFocusRooms(): Promise<FocusRoom[]> {
  const { data, error } = await supabase.rpc('my_focus_rooms')
  if (error) return []
  return (data ?? []) as FocusRoom[]
}

export async function fetchTopics(room: string): Promise<FocusTopic[]> {
  const { data, error } = await supabase.rpc('focus_room_topics', { p_room: room })
  if (error) throw error
  return (data ?? []) as FocusTopic[]
}

export async function addTopic(room: string, body: string): Promise<void> {
  const { error } = await supabase.rpc('focus_add_topic', { p_room: room, p_body: body })
  if (error) throw error
}

export async function voteTopic(id: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('focus_vote_topic', { p_topic: id })
  if (error) throw error
  return data as boolean
}

export async function removeTopic(id: string): Promise<void> {
  const { error } = await supabase.rpc('focus_remove_topic', { p_topic: id })
  if (error) throw error
}

export async function fetchReplies(topic: string): Promise<FocusReply[]> {
  const { data, error } = await supabase.rpc('focus_topic_replies', { p_topic: topic })
  if (error) throw error
  return (data ?? []) as FocusReply[]
}

export async function addReply(topic: string, body: string): Promise<void> {
  const { error } = await supabase.rpc('focus_add_reply', { p_topic: topic, p_body: body })
  if (error) throw error
}

export async function removeReply(id: string): Promise<void> {
  const { error } = await supabase.rpc('focus_remove_reply', { p_reply: id })
  if (error) throw error
}

/** Marks (or unmarks) the answer that solved the student's own doubt. */
export async function acceptReply(topic: string, reply: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('focus_accept_reply', { p_topic: topic, p_reply: reply })
  if (error) throw error
  return data as boolean
}

/** One more minute studied in the room. Quiet on failure (before the SQL is run, say). */
export async function logMinute(room: string): Promise<void> {
  await supabase.rpc('focus_log_minutes', { p_room: room, p_minutes: 1 })
}

/** Null before docs/supabase-study-rooms-engage.sql is run. */
export async function fetchMyStudy(): Promise<MyStudy | null> {
  const { data, error } = await supabase.rpc('focus_my_study')
  if (error || !data) return null
  return data as MyStudy
}

/** Null before docs/supabase-study-rooms-engage.sql is run. */
export async function fetchLeaders(room: string): Promise<RoomLeader[] | null> {
  const { data, error } = await supabase.rpc('focus_room_leaders', { p_room: room })
  if (error) return null
  return (data ?? []) as RoomLeader[]
}

/** "1 h 20 min", "45 min". */
export function minutesLabel(m: number): string {
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest ? `${h} h ${rest} min` : `${h} h`
}

/*
 * The room's focus timer: 25 minutes of focus, then a 5-minute break, on the
 * half hour (:00 and :30), the same for everyone without anything to sync.
 * Everyone in every room breaks together, so a break is when to say hi.
 */
export const FOCUS_MIN = 25
export const CYCLE_MIN = 30

export interface FocusPhase {
  phase: 'focus' | 'break'
  /** Seconds left in this phase. */
  left: number
  /** 0 to 1, how far through this phase. */
  done: number
}

export function focusPhase(now = Date.now()): FocusPhase {
  const cycle = CYCLE_MIN * 60
  const into = Math.floor(now / 1000) % cycle
  const focus = FOCUS_MIN * 60
  if (into < focus) return { phase: 'focus', left: focus - into, done: into / focus }
  return { phase: 'break', left: cycle - into, done: (into - focus) / (cycle - focus) }
}

export async function reportStudent(room: string, userId: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc('focus_report', { p_room: room, p_user: userId, p_reason: reason })
  if (error) throw error
}

/** Every camera goes to every other student, so a room shows this many at most. */
export const MAX_CAMERAS = 8

/** Small and steady: eight of these fit a phone's upload. */
/** Small and slow on purpose: every camera goes to every other student. */
export const CAMERA: MediaTrackConstraints = { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 15, max: 15 } }

const ICE: RTCConfiguration = {
  iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }],
}

type Signal =
  | { from: string; to: string; kind: 'offer' | 'answer'; sdp: RTCSessionDescriptionInit }
  | { from: string; to: string; kind: 'ice'; candidate: RTCIceCandidateInit }

interface Peer {
  pc: RTCPeerConnection
  sender: RTCRtpSender | null
  /** Candidates that arrived before the other side's description. */
  pending: RTCIceCandidateInit[]
}

/*
 * supabase-js hands back the existing channel when one with the same topic is
 * still open, and closing one takes a round trip. Study rooms watches each
 * room (useRoomsOnline) and then, a moment later, the student joins one
 * (useFocusRoom) on the same topic: so a channel is only opened once any
 * earlier one on that topic has fully closed.
 */
const closing = new Map<string, Promise<unknown>>()

function closeChannel(ch: RealtimeChannel) {
  const done = supabase.removeChannel(ch).catch(() => undefined)
  closing.set(ch.topic, done)
  void done.finally(() => {
    if (closing.get(ch.topic) === done) closing.delete(ch.topic)
  })
}

async function openChannel(topic: string, config: { private: boolean; presence: { key: string }; broadcast?: { self: boolean } }) {
  await closing.get(`realtime:${topic}`)
  const left = supabase.getChannels().find((c) => c.topic === `realtime:${topic}`)
  if (left) await supabase.removeChannel(left).catch(() => undefined)
  // Private channels authorise with the student's own token.
  const { data } = await supabase.auth.getSession()
  if (data.session) await supabase.realtime.setAuth(data.session.access_token)
  return supabase.channel(topic, { config })
}

/** Who is in the room now, oldest first, one entry per open tab. */
function presenceList(ch: RealtimeChannel): FocusPresence[] {
  return Object.values(ch.presenceState<FocusPresence>())
    .map((metas) => metas[0])
    .filter((p): p is FocusPresence & { presence_ref: string } => !!p?.session)
    .sort((a, b) => a.joined_at.localeCompare(b.joined_at))
}

/**
 * Who is studying in each room right now, for the Study rooms page (Paul,
 * 3 Nov 2026: "showing other people who are online"). It listens to each
 * room's presence without joining it: the watcher shares nothing and nobody
 * sees it, and only students who may enter a room can watch it (the same
 * Realtime policy as joining).
 */
export function useRoomsOnline(slugs: string[]): Record<string, FocusPresence[]> {
  const [online, setOnline] = useState<Record<string, FocusPresence[]>>({})
  const key = slugs.join(',')
  useEffect(() => {
    let live = true
    const opened: RealtimeChannel[] = []
    for (const slug of key ? key.split(',') : []) {
      void openChannel(`focus:${slug}`, { private: true, presence: { key: `watch-${crypto.randomUUID()}` } }).then((ch) => {
        if (!live) {
          closeChannel(ch)
          return
        }
        opened.push(ch)
        ch.on('presence', { event: 'sync' }, () => {
          if (live) setOnline((o) => ({ ...o, [slug]: presenceList(ch) }))
        }).subscribe((state) => {
          // Can't see in: say nobody, rather than "checking" for ever.
          if (live && (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT')) setOnline((o) => ({ ...o, [slug]: o[slug] ?? [] }))
        })
      })
    }
    return () => {
      live = false
      opened.forEach(closeChannel)
    }
  }, [key])
  return online
}

export type RoomStatus = 'joining' | 'live' | 'denied' | 'error'

/**
 * Joins a room: presence for who is here, a camera connection to each of the
 * first MAX_CAMERAS others, and a nudge to refetch the topics when anyone
 * changes them. Leaves (and stops the camera) on unmount.
 */
export function useFocusRoom(
  room: string,
  me: { user_id: string; name: string; avatar: string | null },
  workingOn: string,
) {
  const [session] = useState(() => crypto.randomUUID())
  const [joinedAt] = useState(() => new Date().toISOString())
  const [status, setStatus] = useState<RoomStatus>('joining')
  const [people, setPeople] = useState<FocusPresence[]>([])
  const [streams, setStreams] = useState<Record<string, MediaStream>>({})
  const [local, setLocal] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string>()
  const [topicsTick, setTopicsTick] = useState(0)
  const [reactions, setReactions] = useState<Reaction[]>([])

  const channel = useRef<RealtimeChannel | null>(null)
  const peers = useRef(new Map<string, Peer>())
  const track = useRef<MediaStreamTrack | null>(null)
  const others = useRef<FocusPresence[]>([])
  const mine = useRef({ working_on: workingOn, camera: false, hand: false })

  /** Shows a cheer for three seconds. */
  const showReaction = useCallback((r: Reaction) => {
    setReactions((all) => [...all.slice(-11), r])
    window.setTimeout(() => setReactions((all) => all.filter((x) => x.id !== r.id)), 3200)
  }, [])

  const send = useCallback((s: Signal) => {
    void channel.current?.send({ type: 'broadcast', event: 'signal', payload: s })
  }, [])

  const drop = useCallback((id: string) => {
    peers.current.get(id)?.pc.close()
    peers.current.delete(id)
    setStreams((s) => {
      if (!(id in s)) return s
      const next = { ...s }
      delete next[id]
      return next
    })
  }, [])

  const makePeer = useCallback(
    (id: string): Peer => {
      const pc = new RTCPeerConnection(ICE)
      const peer: Peer = { pc, sender: null, pending: [] }
      pc.onicecandidate = (e) => e.candidate && send({ from: session, to: id, kind: 'ice', candidate: e.candidate.toJSON() })
      pc.ontrack = (e) => {
        const stream = e.streams[0] ?? new MediaStream([e.track])
        setStreams((s) => ({ ...s, [id]: stream }))
      }
      pc.onconnectionstatechange = () => {
        // A failed link is dropped; the next sync (every few seconds) tries again.
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') drop(id)
      }
      peers.current.set(id, peer)
      return peer
    },
    [drop, send, session],
  )

  // Connect to the first MAX_CAMERAS others by arrival, and let go of anyone
  // who left. Of each pair, the session with the smaller id makes the offer.
  const sync = useCallback(async () => {
    const wanted = new Set(others.current.slice(0, MAX_CAMERAS).map((p) => p.session))
    for (const id of [...peers.current.keys()]) if (!wanted.has(id)) drop(id)
    for (const id of wanted) {
      if (peers.current.has(id) || session > id) continue
      const peer = makePeer(id)
      const tr = peer.pc.addTransceiver('video', { direction: 'sendrecv' })
      peer.sender = tr.sender
      await tr.sender.replaceTrack(track.current)
      const offer = await peer.pc.createOffer()
      await peer.pc.setLocalDescription(offer)
      send({ from: session, to: id, kind: 'offer', sdp: offer })
    }
  }, [drop, makePeer, send, session])

  const onSignal = useCallback(
    async (s: Signal) => {
      if (s.to !== session) return
      if (s.kind === 'offer') {
        drop(s.from)
        const peer = makePeer(s.from)
        await peer.pc.setRemoteDescription(s.sdp)
        const tr = peer.pc.getTransceivers()[0]
        if (tr) {
          tr.direction = 'sendrecv'
          peer.sender = tr.sender
          await tr.sender.replaceTrack(track.current)
        }
        const answer = await peer.pc.createAnswer()
        await peer.pc.setLocalDescription(answer)
        send({ from: session, to: s.from, kind: 'answer', sdp: answer })
        for (const c of peer.pending.splice(0)) await peer.pc.addIceCandidate(c)
        return
      }
      const peer = peers.current.get(s.from)
      if (!peer) return
      if (s.kind === 'answer') {
        if (peer.pc.signalingState !== 'have-local-offer') return
        await peer.pc.setRemoteDescription(s.sdp)
        for (const c of peer.pending.splice(0)) await peer.pc.addIceCandidate(c)
      } else if (s.kind === 'ice') {
        if (peer.pc.remoteDescription) await peer.pc.addIceCandidate(s.candidate)
        else peer.pending.push(s.candidate)
      }
    },
    [drop, makePeer, send, session],
  )

  const announce = useCallback(() => {
    const p: FocusPresence = { session, ...me, ...mine.current, joined_at: joinedAt }
    void channel.current?.track(p)
  }, [joinedAt, me, session])

  useEffect(() => {
    let live = true
    const all = peers.current
    let ch: RealtimeChannel | null = null

    void (async () => {
      const opened = await openChannel(`focus:${room}`, { private: true, presence: { key: session }, broadcast: { self: false } })
      if (!live) {
        closeChannel(opened)
        return
      }
      ch = opened
      channel.current = opened
      opened
        .on('presence', { event: 'sync' }, () => {
          const list = presenceList(opened)
          others.current = list.filter((p) => p.session !== session)
          setPeople(list)
          void sync().catch(() => undefined)
        })
        .on('broadcast', { event: 'signal' }, ({ payload }) => void onSignal(payload as Signal).catch(() => undefined))
        .on('broadcast', { event: 'topics' }, () => setTopicsTick((t) => t + 1))
        .on('broadcast', { event: 'react' }, ({ payload }) => {
          const r = payload as Reaction
          if (typeof r?.emoji === 'string' && (REACTIONS as readonly string[]).includes(r.emoji)) showReaction({ ...r, name: String(r.name ?? '').slice(0, 40) })
        })
      opened.subscribe((state, err) => {
        if (!live) return
        if (state === 'SUBSCRIBED') {
          setStatus('live')
          announce()
        } else if (state === 'CHANNEL_ERROR') {
          setStatus(/unauthori[sz]ed|denied|permission/i.test(err?.message ?? '') ? 'denied' : 'error')
        }
      })
    })()

    // Retry links that failed, and anyone the last sync missed.
    const retry = window.setInterval(() => void sync().catch(() => undefined), 8000)

    return () => {
      live = false
      window.clearInterval(retry)
      for (const p of all.values()) p.pc.close()
      all.clear()
      track.current?.stop()
      track.current = null
      if (ch) closeChannel(ch)
      channel.current = null
    }
    // The room is joined once per mount; `announce` and friends read refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, session])

  const setCamera = useCallback(
    async (on: boolean) => {
      setCameraError(undefined)
      let next: MediaStreamTrack | null = null
      if (on) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: CAMERA, audio: false })
          next = stream.getVideoTracks()[0] ?? null
        } catch (e) {
          setCameraError(
            e instanceof DOMException && e.name === 'NotAllowedError'
              ? 'Your browser blocked the camera. Allow it in the address bar, then try again.'
              : 'We couldn’t start your camera. Check no other app is using it.',
          )
          return
        }
      }
      track.current?.stop()
      track.current = next
      setLocal(next ? new MediaStream([next]) : null)
      await Promise.all([...peers.current.values()].map((p) => p.sender?.replaceTrack(next)))
      mine.current.camera = !!next
      announce()
    },
    [announce],
  )

  const setWorkingOn = useCallback(
    (text: string) => {
      mine.current.working_on = text
      announce()
    },
    [announce],
  )

  const setHand = useCallback(
    (up: boolean) => {
      mine.current.hand = up
      announce()
    },
    [announce],
  )

  /** A cheer, to the room or one student; shown here at once, and to everyone else. */
  const lastReact = useRef(0)
  const react = useCallback(
    (emoji: string, to: string | null = null) => {
      // One a second at most, so a cheer can't flood the room.
      if (Date.now() - lastReact.current < 1000) return
      lastReact.current = Date.now()
      const r: Reaction = { id: crypto.randomUUID(), emoji, name: me.name, to }
      showReaction(r)
      void channel.current?.send({ type: 'broadcast', event: 'react', payload: r })
    },
    [me.name, showReaction],
  )

  /** Tell the room the topics changed, so everyone's board refreshes. */
  const topicsChanged = useCallback(() => {
    void channel.current?.send({ type: 'broadcast', event: 'topics', payload: {} })
  }, [])

  return { session, status, people, streams, local, cameraError, setCamera, setWorkingOn, setHand, react, reactions, topicsTick, topicsChanged }
}
