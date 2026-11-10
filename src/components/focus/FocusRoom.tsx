import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronUp,
  EyeOff,
  Flag,
  Link2,
  LogOut,
  MessageCircle,
  MicOff,
  MoreHorizontal,
  Pencil,
  Send,
  ShieldCheck,
  Trash2,
  Trophy,
  Users,
  Video,
  VideoOff,
} from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import {
  MAX_CAMERAS,
  OPEN_HINTS,
  OPEN_ROOM,
  REACTIONS,
  WORKING_ON_MAX,
  acceptReply,
  addReply,
  addTopic,
  fetchLeaders,
  fetchReplies,
  fetchTopics,
  logMinute,
  minutesLabel,
  removeReply,
  removeTopic,
  reportStudent,
  useFocusRoom,
  voteTopic,
  type FocusPresence,
  type FocusReply,
  type FocusRoom as Room,
  type FocusTopic,
  type Reaction,
  type RoomLeader,
} from '@/lib/focusRooms'
import { Alert, Avatar, Button, Skeleton } from '@/components/ui'
import { skillTracks } from '@/lib/skillTracks'
import { CORE_MODULES } from '@/lib/careerReadinessContent'
import { fetchMyProgramme, moduleDone, suggestedOrder } from '@/lib/programmeStudent'

export interface Me {
  user_id: string
  name: string
  avatar: string | null
}


const sentence = (slug: string) => slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')

/**
 * Ideas for "what are you working on", from the programme itself: its next
 * modules (course-engine programmes, in the order suggested for the student),
 * its skill tracks (Digital Marketing) or its modules (Global Leadership).
 */
async function hintsFor(room: string): Promise<string[]> {
  if (room === OPEN_ROOM) return OPEN_HINTS
  if (room === 'digital-marketing') return [...skillTracks.slice(0, 3).map((t) => t.name), 'Vocabulary', 'Foundation assessment']
  if (room === 'career-readiness') return [...CORE_MODULES.slice(0, 4).map(sentence), 'My project']
  try {
    const p = await fetchMyProgramme(room)
    const next = suggestedOrder(p).filter((m) => !moduleDone(p, m))
    return [...next.slice(0, 3).map((m) => m.title), 'Module quiz', 'My project']
  } catch {
    return ['Module quiz', 'My project', 'Revision']
  }
}

/** Before going in: what you are working on, and whether your camera is on. */
export function FocusLobby({ room, onEnter }: { room: Room; onEnter: (workingOn: string, camera: boolean) => void }) {
  const [text, setText] = useState('')
  const [hints, setHints] = useState<string[]>([])
  useEffect(() => {
    let live = true
    hintsFor(room.slug).then((h) => live && setHints(h))
    return () => {
      live = false
    }
  }, [room.slug])
  const go = (camera: boolean) => onEnter(text.trim(), camera)
  return (
    <div className="mx-auto max-w-xl">
      <Link to="/study-rooms" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900">
        <ArrowLeft size={16} /> Study rooms
      </Link>
      <div className="card p-6 sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-600">Study room</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink-900 sm:text-3xl">{room.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          {room.slug === OPEN_ROOM ? 'Study alongside other students, whatever you’re working on.' : 'Study alongside others in this programme.'} Your camera shows you at your desk, and there’s never any sound.
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
          <p className="mt-2 text-xs text-ink-500">It shows under your camera, so others studying the same thing can find you. Pick one or write your own.</p>
          {hints.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {hints.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setText(h.slice(0, WORKING_ON_MAX))}
                  aria-pressed={text === h}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    text === h ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-900/10 bg-white text-ink-700 hover:border-brand-300'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          )}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button type="submit" icon={Video} className="w-full sm:w-auto sm:flex-1">
              Enter with camera on
            </Button>
            <Button type="button" variant="secondary" icon={VideoOff} className="w-full sm:w-auto sm:flex-1" onClick={() => go(false)}>
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

/** A clock that ticks every `ms`, for the time-in-room labels. */
function useNow(ms: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), ms)
    return () => window.clearInterval(t)
  }, [ms])
  return now
}

/** Seats shown in the grid: everyone on camera, then empty ones up to this. */
const SEATS = MAX_CAMERAS

/**
 * Inside the room: the cameras, as many as fit, and the doubts beside them
 * (Paul, 11 Nov 2026: "keep it simple and keep space for more tiles").
 */
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
  const [logged, setLogged] = useState(0)
  const started = useRef(false)
  const now = useNow(30_000)

  // Turn the camera on once the room is joined, if the student chose to.
  useEffect(() => {
    if (r.status === 'live' && startCamera && !started.current) {
      started.current = true
      void r.setCamera(true)
    }
  }, [r, r.status, startCamera])

  // Count the minutes studied here, a minute at a time, for "Top this week".
  const live = r.status === 'live'
  useEffect(() => {
    if (!live) return
    const t = window.setInterval(() => void logMinute(room.slug).then(() => setLogged((n) => n + 1), () => undefined), 60_000)
    return () => window.clearInterval(t)
  }, [live, room.slug])

  const self = r.people.find((p) => p.session === r.session)
  const others = r.people.filter((p) => p.session !== r.session)
  const onCamera = others.slice(0, MAX_CAMERAS)
  const alsoHere = others.slice(MAX_CAMERAS)
  const empty = Math.max(0, SEATS - 1 - onCamera.length)
  const cheersFor = (session: string) => r.reactions.filter((x) => x.to === session)
  const minsIn = (p: FocusPresence) => (p.joined_at ? Math.max(0, Math.floor((now - new Date(p.joined_at).getTime()) / 60000)) : 0)

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link to="/study-rooms" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900">
            <ArrowLeft size={16} /> Study rooms
          </Link>
          <h1 className="mt-1 truncate font-display text-2xl font-semibold text-ink-900">{room.title}</h1>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-ink-500">
            <span className={`h-2 w-2 rounded-full ${live ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            {live ? `${r.people.length} studying now` : 'Joining…'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={r.local ? 'secondary' : 'primary'} icon={r.local ? VideoOff : Video} onClick={() => void r.setCamera(!r.local)} disabled={!live}>
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-label="Who's here" className="min-w-0">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            <Tile
              person={self ?? { session: r.session, ...me, working_on: workingOn, camera: !!r.local, joined_at: '' }}
              stream={r.local}
              minutes={self ? minsIn(self) : 0}
              cheers={cheersFor(r.session)}
              you
            >
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
                minutes={minsIn(p)}
                cheers={cheersFor(p.session)}
                onCheer={(emoji) => r.react(emoji, p.session)}
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
            {live && Array.from({ length: empty }, (_, i) => <EmptySeat key={i} room={room} invite={i === 0} />)}
          </div>

          {alsoHere.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-700">
                <Users size={15} /> Also here
              </p>
              <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {alsoHere.map((p) => (
                  <li key={p.session} className="card flex items-center gap-3 p-3">
                    <Avatar name={p.name} src={p.avatar} size={32} />
                    <span className="min-w-0 flex-1">
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

        <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <DoubtsBoard room={room.slug} tick={r.topicsTick} onChange={r.topicsChanged} />
          <LeadersCard room={room.slug} tick={logged} />
        </div>
      </div>

      {reporting && <ReportDialog room={room.slug} person={reporting} onClose={() => setReporting(null)} onHide={() => setHidden((h) => new Set(h).add(reporting.session))} />}
    </div>
  )
}

/** A free seat in the grid: room for one more. The first one invites a friend. */
function EmptySeat({ room, invite }: { room: Room; invite: boolean }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/study-rooms/${room.slug}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      /* clipboard blocked: nothing to do */
    }
  }
  return (
    <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-ink-900/10 text-center">
      {invite ? (
        <>
          <span className="text-xs text-ink-500">Room for more</span>
          <Button variant="secondary" size="sm" icon={copied ? Check : Link2} onClick={() => void copy()}>
            {copied ? 'Link copied' : 'Invite a friend'}
          </Button>
        </>
      ) : (
        <span className="text-xs text-ink-400">Open seat</span>
      )}
    </div>
  )
}

/** One student: their camera, or their initials while it's off, with what they're on. */
function Tile({
  person,
  stream,
  minutes,
  cheers,
  onCheer,
  you,
  hiddenByYou,
  onHide,
  onReport,
  children,
}: {
  person: FocusPresence
  stream: MediaStream | null
  minutes: number
  cheers: Reaction[]
  onCheer?: (emoji: string) => void
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
    <div
      className="theme-light group relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#14122b] ring-1 ring-white/10"
    >
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

      <div className="absolute left-2 top-2 flex gap-1.5">
        {minutes > 0 && (
          <span className="rounded-full bg-black/45 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">{minutesLabel(minutes)}</span>
        )}
      </div>

      {/* Cheers sent to this student pop up over their tile. */}
      <div aria-live="polite" className="pointer-events-none absolute inset-x-0 top-1/3 flex justify-center gap-1">
        {cheers.slice(-3).map((c) => (
          <span key={c.id} className="cheer-pop flex flex-col items-center">
            <span className="text-3xl drop-shadow">{c.emoji}</span>
            <span className="rounded-full bg-black/55 px-1.5 text-[10px] text-white">{c.name}</span>
          </span>
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-2.5 pt-8">
        <p className="truncate text-sm font-semibold text-white">{you ? 'You' : person.name}</p>
        {children ?? <p className="truncate text-xs text-white/75">{person.working_on || 'Studying'}</p>}
      </div>

      {!you && (
        <>
          {/* Cheer them: three on hover with a mouse; on a phone's small tile, one, always there. */}
          {onCheer && (
            <div className="absolute bottom-12 right-2 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
              {REACTIONS.slice(0, 3).map((e, i) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => onCheer(e)}
                  aria-label={`Send ${e} to ${person.name}`}
                  className={`h-8 w-8 place-items-center rounded-full bg-black/45 text-base backdrop-blur hover:bg-black/70 ${i === 0 ? 'grid' : 'hidden sm:grid'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
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
        </>
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

type DoubtTab = 'open' | 'solved'

/**
 * The room's doubts: ask one, tap "Me too" on the ones you share, answer what
 * you know, and the student who asked marks the answer that solved it.
 */
function DoubtsBoard({
  room,
  tick,
  onChange,
}: {
  room: string
  tick: number
  onChange: () => void
}) {
  const [topics, setTopics] = useState<FocusTopic[]>()
  const [error, setError] = useState<string>()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState<DoubtTab>('open')
  const [sort, setSort] = useState<'top' | 'new'>('top')
  const [open, setOpen] = useState<string | null>(null)

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
      void load()
    }
  }

  /** "Me too" counts at once; the server catches up. */
  function vote(t: FocusTopic) {
    setTopics((all) => all?.map((x) => (x.id === t.id ? { ...x, voted: !x.voted, votes: x.votes + (x.voted ? -1 : 1) } : x)))
    void act(() => voteTopic(t.id))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (text.trim().length < 3) return
    setBusy(true)
    await act(() => addTopic(room, text.trim()))
    setText('')
    setTab('open')
    setBusy(false)
  }

  // Before docs/supabase-study-rooms-engage.sql: no answers, so no tabs.
  const answers = topics?.some((t) => t.replies !== undefined) ?? false
  const solved = topics?.filter((t) => t.solved) ?? []
  const unsolved = topics?.filter((t) => !t.solved) ?? []
  const shown = [...(tab === 'solved' ? solved : unsolved)].sort((a, b) =>
    sort === 'new' ? b.created_at.localeCompare(a.created_at) : b.votes - a.votes || b.created_at.localeCompare(a.created_at),
  )

  return (
    <aside className="card flex flex-col p-5 lg:max-h-[calc(100vh-14rem)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
            <MessageCircle size={18} className="text-brand-600" /> Doubts
          </h2>
          <p className="mt-0.5 text-sm text-ink-500">Ask the room. Tap “Me too” on yours, and answer what you know.</p>
        </div>
        {topics && unsolved.length > 0 && (
          <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">{unsolved.length} open</span>
        )}
      </div>

      <form onSubmit={submit} className="mt-4 flex gap-2">
        <input
          value={text}
          maxLength={160}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. How do I pick keywords for a new site?"
          aria-label="Ask a doubt"
          className="min-w-0 flex-1 rounded-xl border border-ink-900/10 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none placeholder:text-ink-400 focus:border-brand-500"
        />
        <Button type="submit" icon={Send} disabled={busy || text.trim().length < 3}>
          Ask
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}

      {answers && (
        <div className="mt-4 flex items-center justify-between gap-2">
          <div role="tablist" className="inline-flex rounded-xl bg-ink-900/[0.05] p-1 text-xs font-semibold">
            {(['open', 'solved'] as const).map((t) => (
              <button
                key={t}
                role="tab"
                type="button"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`rounded-lg px-3 py-1.5 transition-colors ${tab === t ? 'bg-white text-ink-900 shadow-e1' : 'text-ink-500 hover:text-ink-800'}`}
              >
                {t === 'open' ? `Open (${unsolved.length})` : `Solved (${solved.length})`}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setSort((s) => (s === 'top' ? 'new' : 'top'))} className="text-xs font-medium text-ink-500 hover:text-ink-800">
            {sort === 'top' ? 'Most asked' : 'Newest'} ⇅
          </button>
        </div>
      )}

      <div className="mt-3 -mx-1 flex-1 overflow-y-auto px-1">
        {topics === undefined && !error && <Skeleton className="h-24 w-full" />}
        {topics && shown.length === 0 && (
          <p className="py-6 text-center text-sm text-ink-500">
            {tab === 'solved' ? 'Nothing solved yet. Answer an open doubt!' : 'No doubts yet. Ask the first one.'}
          </p>
        )}
        <ul className="space-y-2">
          {shown.map((t) => (
            <li key={t.id} className={`rounded-xl border bg-white p-3 ${t.solved ? 'border-emerald-300/50' : 'border-ink-900/[0.06]'}`}>
              <div className="flex gap-3">
                <button
                  type="button"
                  aria-pressed={t.voted}
                  aria-label={t.voted ? 'Take back Me too' : 'Me too'}
                  onClick={() => vote(t)}
                  className={`press flex w-14 shrink-0 flex-col items-center justify-center rounded-lg border py-1.5 transition-colors ${
                    t.voted ? 'border-brand-500 bg-brand-600 text-white' : 'border-ink-900/10 text-ink-600 hover:border-brand-300 hover:text-brand-700'
                  }`}
                >
                  <ChevronUp size={16} />
                  <span className="text-sm font-bold leading-none">{t.votes}</span>
                  <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide">Me too</span>
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug text-ink-900">
                    {t.solved && (
                      <span className="mr-1.5 inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 align-middle text-[10px] font-semibold text-emerald-700">
                        <CheckCircle2 size={11} /> Solved
                      </span>
                    )}
                    {t.body}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-500">
                    <span>
                      {t.mine ? 'You' : t.author} · {ago(t.created_at)}
                    </span>
                    {t.replies !== undefined && (
                      <button
                        type="button"
                        onClick={() => setOpen((o) => (o === t.id ? null : t.id))}
                        aria-expanded={open === t.id}
                        className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:text-brand-800"
                      >
                        <MessageCircle size={12} />
                        {t.replies === 0 ? 'Answer' : `${t.replies} answer${t.replies === 1 ? '' : 's'}`}
                      </button>
                    )}
                    {t.mine && (
                      <button type="button" onClick={() => void act(() => removeTopic(t.id))} className="inline-flex items-center gap-1 text-ink-400 hover:text-rose-600">
                        <Trash2 size={12} /> Remove
                      </button>
                    )}
                  </p>
                </div>
              </div>
              {open === t.id && <Answers topic={t} onChange={() => void act(async () => undefined)} />}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}

/** A doubt's answers, and the box to add one. */
function Answers({ topic, onChange }: { topic: FocusTopic; onChange: () => void }) {
  const [replies, setReplies] = useState<FocusReply[]>()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  const load = () => fetchReplies(topic.id).then(setReplies, (e) => setError(errorMessage(e)))
  // Reload when the count changes: someone else answered.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => void load(), [topic.id, topic.replies, topic.solved])

  async function run(fn: () => Promise<unknown>) {
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
    if (!text.trim()) return
    setBusy(true)
    await run(() => addReply(topic.id, text.trim()))
    setText('')
    setBusy(false)
  }

  return (
    <div className="mt-3 border-t border-ink-900/[0.06] pt-3">
      {replies === undefined && !error && <Skeleton className="h-12 w-full" />}
      <ul className="space-y-2">
        {replies?.map((a) => (
          <li key={a.id} className={`flex gap-2.5 rounded-lg p-2 ${a.accepted ? 'bg-emerald-50 ring-1 ring-emerald-300/50' : ''}`}>
            <Avatar name={a.author} src={a.avatar} size={26} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-ink-800">
                {a.mine ? 'You' : a.author} <span className="font-normal text-ink-400">· {ago(a.created_at)}</span>
                {a.accepted && (
                  <span className="ml-1.5 inline-flex items-center gap-0.5 text-emerald-700">
                    <CheckCircle2 size={11} /> Solved it
                  </span>
                )}
              </p>
              <p className="mt-0.5 whitespace-pre-wrap text-sm leading-snug text-ink-800">{a.body}</p>
              <div className="mt-1 flex gap-3 text-[11px]">
                {topic.mine && !a.mine && (
                  <button type="button" onClick={() => void run(() => acceptReply(topic.id, a.id))} className="font-semibold text-emerald-700 hover:text-emerald-800">
                    {a.accepted ? 'Not solved' : 'This solved it'}
                  </button>
                )}
                {a.mine && (
                  <button type="button" onClick={() => void run(() => removeReply(a.id))} className="text-ink-400 hover:text-rose-600">
                    Remove
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      {replies?.length === 0 && <p className="text-xs text-ink-500">No answers yet. Know it? Help them out.</p>}
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
      <form onSubmit={submit} className="mt-2 flex gap-2">
        <input
          value={text}
          maxLength={500}
          onChange={(e) => setText(e.target.value)}
          placeholder={topic.mine ? 'Add a detail…' : 'Write an answer…'}
          aria-label="Write an answer"
          className="min-w-0 flex-1 rounded-lg border border-ink-900/10 bg-white px-3 py-2 text-sm text-ink-900 outline-none placeholder:text-ink-400 focus:border-brand-500"
        />
        <Button type="submit" size="sm" disabled={busy || !text.trim()}>
          Send
        </Button>
      </form>
    </div>
  )
}

/** This week's five who studied longest here: a friendly nudge, refreshed as the minutes add up. */
function LeadersCard({ room, tick }: { room: string; tick: number }) {
  const [leaders, setLeaders] = useState<RoomLeader[] | null>()
  useEffect(() => {
    let on = true
    fetchLeaders(room).then((l) => on && setLeaders(l))
    return () => {
      on = false
    }
  }, [room, tick])
  if (!leaders || leaders.length === 0) return null
  return (
    <section className="card p-5">
      <h2 className="inline-flex items-center gap-2 font-display text-base font-semibold text-ink-900">
        <Trophy size={16} className="text-amber-500" /> Top this week
      </h2>
      <ol className="mt-3 space-y-2">
        {leaders.map((l, i) => (
          <li key={`${l.name}-${i}`} className={`flex items-center gap-3 rounded-lg px-2 py-1.5 ${l.mine ? 'bg-brand-50' : ''}`}>
            <span className="w-5 text-center text-sm font-bold text-ink-400">{['🥇', '🥈', '🥉'][i] ?? i + 1}</span>
            <Avatar name={l.name} src={l.avatar} size={28} />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-900">{l.mine ? 'You' : l.name}</span>
            <span className="text-xs font-semibold tabular-nums text-ink-600">{minutesLabel(l.minutes)}</span>
          </li>
        ))}
      </ol>
    </section>
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
