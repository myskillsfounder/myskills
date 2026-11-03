import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowRight, MicOff, ShieldCheck, Video, VideoOff } from 'lucide-react'
import { CAMERA, OPEN_HINTS, OPEN_ROOM, WORKING_ON_MAX } from '@/lib/focusRooms'

/**
 * The top of Study rooms (Paul, 3 Nov 2026: "the top card should give camera
 * view"): a check-your-camera screen for the Open study room. The student sees
 * themselves, says what they're working on, and joins in one tap, past the
 * room's own lobby. The camera starts only when they ask, and the preview is
 * stopped before the room asks for it again (the browser doesn't ask twice).
 */
export function StudyNowCard({ topics }: { topics: number | null }) {
  const navigate = useNavigate()
  const video = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string>()
  const [text, setText] = useState('')

  useEffect(() => {
    if (video.current) video.current.srcObject = stream
    return () => stream?.getTracks().forEach((t) => t.stop())
  }, [stream])

  async function startCamera() {
    setStarting(true)
    setError(undefined)
    try {
      setStream(await navigator.mediaDevices.getUserMedia({ video: CAMERA, audio: false }))
    } catch (e) {
      setError(
        e instanceof DOMException && e.name === 'NotAllowedError'
          ? 'Your browser blocked the camera. Allow it in the address bar, then try again.'
          : 'We couldn’t start your camera. Check no other app is using it.',
      )
    } finally {
      setStarting(false)
    }
  }

  function join(camera: boolean) {
    setStream(null)
    void navigate({ to: '/study-rooms/$room', params: { room: OPEN_ROOM }, search: { on: text.trim(), cam: camera ? 1 : 0 } })
  }

  return (
    <section className="theme-light relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#92400e] p-5 text-white shadow-e2 sm:p-8">
      <span aria-hidden className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-amber-400/25 blur-3xl" />
      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200">
            Open study room · Live now{topics ? ` · ${topics} topic${topics === 1 ? '' : 's'}` : ''}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl">
            Study together, <span className="text-amber-200">wherever you are.</span>
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/80">
            Check your camera, say what you’re working on, and join students studying right now. Any subject, any programme.
          </p>

          <form
            className="mt-5"
            onSubmit={(e) => {
              e.preventDefault()
              join(true)
            }}
          >
            <label htmlFor="study-now-on" className="text-sm font-semibold text-white">
              What are you working on?
            </label>
            <input
              id="study-now-on"
              value={text}
              maxLength={WORKING_ON_MAX}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Exam prep, or my project"
              className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-[15px] text-white outline-none placeholder:text-white/45 focus:border-amber-300"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {OPEN_HINTS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setText(h)}
                  aria-pressed={text === h}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    text === h ? 'border-amber-300 bg-amber-300/20 text-amber-100' : 'border-white/15 bg-white/5 text-white/80 hover:border-white/35'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-[#1e1b4b] shadow-e1 transition-colors hover:bg-amber-300"
              >
                Join now <ArrowRight size={16} />
              </button>
              <button type="button" onClick={() => join(false)} className="text-sm font-medium text-white/75 hover:text-white">
                Join with camera off
              </button>
            </div>
          </form>
        </div>

        {/* You, as the room will see you: mirrored, like a mirror. First on a
            phone, beside the words on a computer. */}
        <div className="order-first lg:order-none">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#14122b] ring-1 ring-white/15">
            {stream ? (
              <video ref={video} autoPlay playsInline muted className="h-full w-full -scale-x-100 object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                  <VideoOff size={24} className="text-white/70" />
                </span>
                <p className="text-sm text-white/75">See yourself before you join.</p>
                <button
                  type="button"
                  onClick={() => void startCamera()}
                  disabled={starting}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink-900 disabled:opacity-60"
                >
                  <Video size={15} /> {starting ? 'Starting…' : 'Turn on camera'}
                </button>
                {error && <p className="max-w-xs text-xs text-amber-200">{error}</p>}
              </div>
            )}
            {stream && (
              <>
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Camera preview
                </span>
                <button
                  type="button"
                  onClick={() => setStream(null)}
                  className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold hover:bg-black/70"
                >
                  <VideoOff size={12} /> Turn off
                </button>
                {text.trim() && (
                  <span className="absolute inset-x-3 bottom-3 truncate rounded-lg bg-black/55 px-3 py-1.5 text-xs">
                    Working on: {text.trim()}
                  </span>
                )}
              </>
            )}
          </div>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/60">
            <span className="inline-flex items-center gap-1.5">
              <MicOff size={12} /> No sound, ever
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={12} /> Nothing is recorded
            </span>
          </p>
        </div>
      </div>
    </section>
  )
}
