import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  ChevronUp,
  EyeOff,
  Flag,
  LogOut,
  MicOff,
  MoreHorizontal,
  Pencil,
  Send,
  ShieldCheck,
  Trash2,
  Users,
  Video,
  VideoOff,
} from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import {
  MAX_CAMERAS,
  addTopic,
  fetchTopics,
  removeTopic,
  reportStudent,
  useFocusRoom,
  voteTopic,
  type FocusPresence,
  type FocusRoom as Room,
  type FocusTopic,
} from '@/lib/focusRooms'
import { Alert, Avatar, Button, Skeleton } from '@/components/ui'

export interface Me {
  user_id: string
  name: string
  avatar: string | null
}

const WORKING_ON_MAX = 80

/** Before going in: what you are working on, and whether your camera is on. */
export function FocusLobby({ room, onEnter }: { room: Room; onEnter: (workingOn: string, camera: boolean) => void }) {
  const [text, setText] = useState('')
  const go = (camera: boolean) => onEnter(text.trim(), camera)
  return (
    <div className="mx-auto max-w-xl">
      <Link to="/community/focus-rooms" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900">
        <ArrowLeft size={16} /> Focus Rooms
      </Link>
      <div className="card p-6 sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-600">Focus Room</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink-900 sm:text-3xl">{room.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          Study alongside others in this programme. Your camera shows you at your desk, and there’s never any sound.
        </p>
        <form
          className="mt-6"
          onSubmit={(e) => {
            e.preventDefault()
            go(true)
          }}
        >
          <label htmlFor="working-on" className="text-sm font-semibold text-ink-900">
            What are you working on?
          </label>
          <input
            id="working-on"
            value={text}
            maxLength={WORKING_ON_MAX}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Module 3 quiz, or my project brief"
            className="mt-2 w-full rounded-xl border border-ink-900/10 bg-white px-4 py-3 text-[15px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-brand-500"
          />
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button type="submit" icon={Video} full>
              Enter with camera on
            </Button>
            <Button type="button" variant="secondary" icon={VideoOff} full onClick={() => go(false)}>
              Enter with camera off
            </Button>
          </div>
        </form>
        <SafetyNote className="mt-6" />
      </div>
    </div>
  )
}

function SafetyNote({ className = '' }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-ink-500 ${className}`}>
      <li className="inline-flex items-center gap-1.5">
        <MicOff size={13} /> Camera only, no sound
      </li>
      <li className="inline-flex items-center gap-1.5">
        <ShieldCheck size={13} className="text-emerald-600" /> Nothing is recorded
      </li>
      <li className="inline-flex items-center gap-1.5">
        <Flag size={13} /> Report anyone who makes it unsafe
      </li>
    </ul>
  )
}

/** Inside the room: the cameras, and the topics board beside them. */
export function FocusRoomLive({
  room,
  me,
  workingOn: initialWorkingOn,
  camera: startCamera,
  onLeave,
}: {
  room: Room
  me: Me
  workingOn: string
  camera: boolean
  onLeave: () => void
}) {
  const r = useFocusRoom(room.slug, me, initialWorkingOn)
  const [workingOn, setWorkingOn] = useState(initialWorkingOn)
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [reporting, setReporting] = useState<FocusPresence | null>(null)
  const started = useRef(false)

  // Turn the camera on once the room is joined, if the student chose to.
  useEffect(() => {
    if (r.status === 'live' && startCamera && !started.current) {
      started.current = true
      void r.setCamera(true)
    }
  }, [r, r.status, startCamera])

  const self = r.people.find((p) => p.session === r.session)
  const others = r.people.filter((p) => p.session !== r.session)
  const onCamera = others.slice(0, MAX_CAMERAS)
  const alsoHere = others.slice(MAX_CAMERAS)

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link to="/community/focus-rooms" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900">
            <ArrowLeft size={16} /> Focus Rooms
          </Link>
          <h1 className="mt-1 truncate font-display text-2xl font-semibold text-ink-900">{room.title}</h1>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-ink-500">
            <span className={`h-2 w-2 rounded-full ${r.status === 'live' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            {r.status === 'live' ? `${r.people.length} studying now` : 'Joining…'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={r.local ? 'secondary' : 'primary'} icon={r.local ? VideoOff : Video} onClick={() => void r.setCamera(!r.local)} disabled={r.status !== 'live'}>
            {r.local ? 'Camera off' : 'Camera on'}
          </Button>
          <Button variant="ghost" icon={LogOut} onClick={onLeave}>
            Leave
          </Button>
        </div>
      </div>

      {r.status === 'denied' && (
        <Alert tone="danger" title="This room is for students in the programme">
          <p>Start the programme first, then come back to its room.</p>
        </Alert>
      )}
      {r.status === 'error' && (
        <Alert tone="danger" title="Couldn’t join the room">
          <p>Check your connection and reload the page.</p>
        </Alert>
      )}
      {r.cameraError && (
        <div className="mb-4">
          <Alert tone="warning" title="Camera">
            <p>{r.cameraError}</p>
          </Alert>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-label="Who's here">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-3">
            <Tile person={self ?? { session: r.session, ...me, working_on: workingOn, camera: !!r.local, joined_at: '' }} stream={r.local} you>
              <WorkingOnEdit
                value={workingOn}
                onSave={(t) => {
                  setWorkingOn(t)
                  r.setWorkingOn(t)
                }}
              />
            </Tile>
            {onCamera.map((p) => (
              <Tile
                key={p.session}
                person={p}
                stream={hidden.has(p.session) ? null : r.streams[p.session] ?? null}
                hiddenByYou={hidden.has(p.session)}
                onHide={() =>
                  setHidden((h) => {
                    const next = new Set(h)
                    if (next.has(p.session)) next.delete(p.session)
                    else next.add(p.session)
                    return next
                  })
                }
                onReport={() => setReporting(p)}
              />
            ))}
          </div>
          {others.length === 0 && r.status === 'live' && (
            <p className="mt-4 rounded-2xl border border-dashed border-ink-900/10 p-5 text-center text-sm text-ink-500">
              You’re the first one here. Others in {room.title} will appear as they join.
            </p>
          )}
          {alsoHere.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-700">
                <Users size={15} /> Also here
              </p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {alsoHere.map((p) => (
                  <li key={p.session} className="card flex items-center gap-3 p-3">
                    <Avatar name={p.name} src={p.avatar} size={32} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink-900">{p.name}</span>
                      <span className="block truncate text-xs text-ink-500">{p.working_on || 'Studying'}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <SafetyNote className="mt-5" />
        </section>

        <TopicsBoard room={room.slug} tick={r.topicsTick} onChange={r.topicsChanged} />
      </div>

      {reporting && <ReportDialog room={room.slug} person={reporting} onClose={() => setReporting(null)} onHide={() => setHidden((h) => new Set(h).add(reporting.session))} />}
    </div>
  )
}

/** One student: their camera, or their initials while it's off, with what they're on. */
function Tile({
  person,
  stream,
  you,
  hiddenByYou,
  onHide,
  onReport,
  children,
}: {
  person: FocusPresence
  stream: MediaStream | null
  you?: boolean
  hiddenByYou?: boolean
  onHide?: () => void
  onReport?: () => void
  children?: React.ReactNode
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const [menu, setMenu] = useState(false)
  const showVideo = !!stream && (you || person.camera)
  useEffect(() => {
    if (ref.current) ref.current.srcObject = showVideo ? stream : null
  }, [stream, showVideo])

  return (
    <div className="theme-light relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#14122b] ring-1 ring-white/10">
      {showVideo ? (
        <video ref={ref} autoPlay playsInline muted className={`h-full w-full object-cover ${you ? '-scale-x-100' : ''}`} />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2">
          <Avatar name={person.name} src={person.avatar} size={56} />
          <span className="inline-flex items-center gap-1 text-[11px] text-white/50">
            {hiddenByYou ? <><EyeOff size={12} /> Hidden by you</> : <><VideoOff size={12} /> Camera off</>}
          </span>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-2.5 pt-8">
        <p className="truncate text-sm font-semibold text-white">{you ? 'You' : person.name}</p>
        {children ?? <p className="truncate text-xs text-white/75">{person.working_on || 'Studying'}</p>}
      </div>
      {!you && (
        <div className="absolute right-2 top-2">
          <button
            type="button"
            aria-label={`Options for ${person.name}`}
            onClick={() => setMenu((m) => !m)}
            className="grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"
          >
            <MoreHorizontal size={16} />
          </button>
          {menu && (
            <div className="absolute right-0 mt-1 w-40 overflow-hidden rounded-xl bg-white text-sm shadow-e2 ring-1 ring-black/5">
              <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-ink-700 hover:bg-ink-50" onClick={() => { setMenu(false); onHide?.() }}>
                <EyeOff size={14} /> {hiddenByYou ? 'Show video' : 'Hide video'}
              </button>
              <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-rose-600 hover:bg-rose-50" onClick={() => { setMenu(false); onReport?.() }}>
                <Flag size={14} /> Report
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function WorkingOnEdit({ value, onSave }: { value: string; onSave: (t: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(value)
  if (!editing)
    return (
      <button type="button" onClick={() => { setText(value); setEditing(true) }} className="flex max-w-full items-center gap-1 text-left text-xs text-white/75 hover:text-white">
        <span className="truncate">{value || 'Say what you’re working on'}</span>
        <Pencil size={11} className="shrink-0" />
      </button>
    )
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave(text.trim())
        setEditing(false)
      }}
    >
      <input
        autoFocus
        value={text}
        maxLength={WORKING_ON_MAX}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => { onSave(text.trim()); setEditing(false) }}
        aria-label="What you're working on"
        className="w-full rounded-md bg-white/15 px-2 py-1 text-xs text-white outline-none placeholder:text-white/50"
        placeholder="What are you working on?"
      />
    </form>
  )
}

/** The room's topics: post one, upvote the ones that matter, most votes first. */
function TopicsBoard({ room, tick, onChange }: { room: string; tick: number; onChange: () => void }) {
  const [topics, setTopics] = useState<FocusTopic[]>()
  const [error, setError] = useState<string>()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => fetchTopics(room).then(setTopics, (e) => setError(errorMessage(e)))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => void load(), [room, tick])

  async function act(fn: () => Promise<unknown>) {
    setError(undefined)
    try {
      await fn()
      await load()
      onChange()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (text.trim().length < 3) return
    setBusy(true)
    await act(() => addTopic(room, text.trim()))
    setText('')
    setBusy(false)
  }

  return (
    <aside className="card flex flex-col p-5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)]">
      <h2 className="font-display text-lg font-semibold text-ink-900">Important topics</h2>
      <p className="mt-0.5 text-sm text-ink-500">Post a doubt or topic. Upvote the ones you want covered.</p>
      <form onSubmit={submit} className="mt-4 flex gap-2">
        <input
          value={text}
          maxLength={160}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. How do I pick keywords for a new site?"
          aria-label="New topic"
          className="min-w-0 flex-1 rounded-xl border border-ink-900/10 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none placeholder:text-ink-400 focus:border-brand-500"
        />
        <Button type="submit" icon={Send} disabled={busy || text.trim().length < 3} aria-label="Post topic" />
      </form>
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      <div className="mt-4 -mx-1 flex-1 overflow-y-auto px-1">
        {topics === undefined && !error && <Skeleton className="h-24 w-full" />}
        {topics?.length === 0 && <p className="py-6 text-center text-sm text-ink-500">No topics yet. Start one.</p>}
        <ul className="space-y-2">
          {topics?.map((t) => (
            <li key={t.id} className="flex gap-3 rounded-xl border border-ink-900/[0.06] bg-white p-3">
              <button
                type="button"
                aria-pressed={t.voted}
                aria-label={t.voted ? 'Remove your upvote' : 'Upvote'}
                onClick={() => void act(() => voteTopic(t.id))}
                className={`flex w-11 shrink-0 flex-col items-center justify-center rounded-lg border py-1 text-sm font-semibold transition-colors ${
                  t.voted ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-900/10 text-ink-600 hover:border-brand-300'
                }`}
              >
                <ChevronUp size={16} />
                {t.votes}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-ink-900">{t.body}</p>
                <p className="mt-1 flex items-center gap-2 text-xs text-ink-500">
                  {t.mine ? 'You' : t.author} · {ago(t.created_at)}
                  {t.mine && (
                    <button type="button" onClick={() => void act(() => removeTopic(t.id))} className="inline-flex items-center gap-1 text-ink-400 hover:text-rose-600">
                      <Trash2 size={12} /> Remove
                    </button>
                  )}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}

function ago(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

const REASONS = ['Inappropriate on camera', 'Harassing or rude', 'Spam or advertising', 'Something else']

function ReportDialog({ room, person, onClose, onHide }: { room: string; person: FocusPresence; onClose: () => void; onHide: () => void }) {
  const [reason, setReason] = useState(REASONS[0])
  const [detail, setDetail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string>()

  async function send() {
    setState('sending')
    setError(undefined)
    try {
      await reportStudent(room, person.user_id, detail.trim() ? `${reason}: ${detail.trim()}` : reason)
      onHide()
      setState('sent')
    } catch (e) {
      setError(errorMessage(e))
      setState('idle')
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={`Report ${person.name}`} className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        {state === 'sent' ? (
          <>
            <h2 className="font-display text-lg font-semibold text-ink-900">Thanks for telling us</h2>
            <p className="mt-2 text-sm text-ink-600">Our team will look at it. We’ve hidden {person.name}’s video for you.</p>
            <Button className="mt-5" onClick={onClose}>Done</Button>
          </>
        ) : (
          <>
            <h2 className="font-display text-lg font-semibold text-ink-900">Report {person.name}</h2>
            <p className="mt-1 text-sm text-ink-600">Only our team sees this. {person.name} isn’t told who reported.</p>
            <div className="mt-4 space-y-2">
              {REASONS.map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm text-ink-800">
                  <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} />
                  {r}
                </label>
              ))}
            </div>
            <textarea
              value={detail}
              maxLength={200}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Anything else we should know (optional)"
              className="mt-3 w-full rounded-xl border border-ink-900/10 bg-white p-3 text-sm text-ink-900 outline-none focus:border-brand-500"
              rows={3}
            />
            {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button variant="danger" icon={Flag} disabled={state === 'sending'} onClick={() => void send()}>
                Send report
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
