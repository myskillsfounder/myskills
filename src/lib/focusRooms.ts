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

/** A room the student may enter: one per programme they are in. */
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
}

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

export async function reportStudent(room: string, userId: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc('focus_report', { p_room: room, p_user: userId, p_reason: reason })
  if (error) throw error
}

/** Every camera goes to every other student, so a room shows this many at most. */
export const MAX_CAMERAS = 8

/** Small and steady: eight of these fit a phone's upload. */
const CAMERA: MediaTrackConstraints = { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 15, max: 15 } }

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

  const channel = useRef<RealtimeChannel | null>(null)
  const peers = useRef(new Map<string, Peer>())
  const track = useRef<MediaStreamTrack | null>(null)
  const others = useRef<FocusPresence[]>([])
  const mine = useRef({ working_on: workingOn, camera: false })

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
    const ch = supabase.channel(`focus:${room}`, {
      config: { private: true, presence: { key: session }, broadcast: { self: false } },
    })
    channel.current = ch

    ch.on('presence', { event: 'sync' }, () => {
      const list = Object.values(ch.presenceState<FocusPresence>())
        .map((metas) => metas[0])
        .filter((p): p is FocusPresence & { presence_ref: string } => !!p?.session)
        .sort((a, b) => a.joined_at.localeCompare(b.joined_at))
      others.current = list.filter((p) => p.session !== session)
      setPeople(list)
      void sync().catch(() => undefined)
    })
      .on('broadcast', { event: 'signal' }, ({ payload }) => void onSignal(payload as Signal).catch(() => undefined))
      .on('broadcast', { event: 'topics' }, () => setTopicsTick((t) => t + 1))

    void (async () => {
      // Private channels authorise with the student's own token.
      const { data } = await supabase.auth.getSession()
      if (data.session) await supabase.realtime.setAuth(data.session.access_token)
      if (!live) return
      ch.subscribe((state, err) => {
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
      void supabase.removeChannel(ch)
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

  /** Tell the room the topics changed, so everyone's board refreshes. */
  const topicsChanged = useCallback(() => {
    void channel.current?.send({ type: 'broadcast', event: 'topics', payload: {} })
  }, [])

  return { session, status, people, streams, local, cameraError, setCamera, setWorkingOn, topicsTick, topicsChanged }
}
