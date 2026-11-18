import { useState } from 'react'
import { Check, Link2, MicOff, Share2 } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

/*
 * Why study in a room, under the rooms (Paul, 18 Nov 2026: "it should give
 * them a feel to study online, study with friends ... make it feel more Gen
 * Z"). A "study with me" panel: what a room looks like, how it works as four
 * short cards, and a way to bring friends in.
 *
 * Colours are written as fixed values with white text, so the app's dark
 * theme leaves them as they are.
 */

/** The room in the picture: an illustration, not people who are online. */
const SEATS: { emoji: string; status: string; tone: string; cam: boolean }[] = [
  { emoji: '🧑‍💻', status: 'SEO quiz', tone: 'from-[#7b6cf6] to-[#4f46e5]', cam: true },
  { emoji: '👩‍🎓', status: 'Module 3', tone: 'from-[#ec4899] to-[#a855f7]', cam: true },
  { emoji: '🎧', status: 'Project grind', tone: 'from-[#f59e0b] to-[#ef4444]', cam: false },
  { emoji: '📚', status: 'Revision', tone: 'from-[#10b981] to-[#0ea5e9]', cam: true },
]

const VIBES: { emoji: string; title: string; body: string; tint: string }[] = [
  { emoji: '🎯', title: 'Pick your room', body: 'Your course, your people. Everyone in there is on the same thing as you.', tint: 'from-[#7b6cf6]/25' },
  { emoji: '💬', title: 'Drop your status', body: '“SEO quiz”, “project grind”, “revision”. It shows under your tile.', tint: 'from-[#ec4899]/25' },
  { emoji: '📹', title: 'Cam on, mic off', body: 'Silent study, side by side. No awkward small talk, just focus.', tint: 'from-[#f59e0b]/25' },
  { emoji: '🙋', title: 'Stuck? Ask the room', body: 'Post a doubt, get answers from peers, and “Me too” the good ones.', tint: 'from-[#10b981]/25' },
]

function InviteFriends() {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/study-rooms`
  async function invite() {
    trackEvent('study_invite', { via: 'share' in navigator ? 'share' : 'copy' })
    // A phone shares straight to WhatsApp or Instagram; a computer copies the link.
    if ('share' in navigator) {
      try {
        await navigator.share({ title: 'Study with me on MySkills', text: 'Come study with me on MySkills 📚 Cam on, mic off.', url })
        return
      } catch {
        /* closed the share sheet, or sharing isn't allowed: copy instead */
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      /* clipboard blocked: nothing more to do */
    }
  }
  return (
    <button
      type="button"
      onClick={() => void invite()}
      className="press inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-6 text-[15px] font-semibold text-[#1b1446] shadow-[0_10px_30px_-10px_rgba(255,255,255,0.6)] transition-transform hover:-translate-y-0.5"
    >
      {copied ? <Check size={18} /> : 'share' in navigator ? <Share2 size={18} /> : <Link2 size={18} />}
      {copied ? 'Link copied!' : 'Invite your friends'}
    </button>
  )
}

/** The picture: a room, live, with cheers floating up and a doubt being asked. */
function RoomPicture() {
  return (
    <div className="relative mx-auto w-full max-w-sm" aria-hidden>
      <div className="rounded-3xl border border-white/15 bg-white/[0.06] p-3 shadow-[0_30px_80px_-30px_rgba(124,92,246,0.9)] backdrop-blur-xl">
        <div className="mb-2.5 flex items-center justify-between px-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ef4444] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live
          </span>
          <span className="text-[11px] font-medium text-white/70">4 studying · 🔇 no sound</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {SEATS.map((s, i) => (
            <div key={s.status} className={`relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br ${s.tone}`}>
              <span className={`study-bob absolute inset-0 flex items-center justify-center text-4xl`} style={{ animationDelay: `${i * 0.4}s` }}>
                {s.emoji}
              </span>
              {!s.cam && <span className="absolute inset-0 bg-black/30" />}
              <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                {s.status}
              </span>
              <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-black/40 text-white">
                <MicOff size={10} />
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* A doubt, and the room agreeing. */}
      <div className="study-bob absolute -bottom-14 -left-4 max-w-[13rem] rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-left shadow-xl sm:-left-10" style={{ animationDelay: '0.8s' }}>
        <p className="text-[12px] font-semibold leading-snug text-[#1b1446]">How do I pick keywords for a new site? 🤔</p>
        <p className="mt-1 text-[11px] font-bold text-[#7b6cf6]">▲ 12 · Me too</p>
      </div>
      {/* Cheers floating up. */}
      <span className="study-rise absolute -right-2 top-10 text-2xl">🔥</span>
      <span className="study-rise absolute -right-5 top-24 text-xl" style={{ animationDelay: '1.2s' }}>👏</span>
      <span className="study-rise absolute right-6 -top-3 text-xl" style={{ animationDelay: '2.1s' }}>💪</span>
    </div>
  )
}

export function StudyTogether() {
  return (
    <section className="theme-light relative overflow-hidden rounded-[2rem] bg-[#0d0a24] text-white">
      <span aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#7b6cf6]/40 blur-3xl" />
      <span aria-hidden className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-[#ec4899]/25 blur-3xl" />
      <span aria-hidden className="pointer-events-none absolute right-1/3 top-10 h-56 w-56 rounded-full bg-[#f59e0b]/15 blur-3xl" />

      <div className="relative grid items-center gap-12 p-6 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1 text-xs font-semibold text-white/85 backdrop-blur">
            ✨ Study with me, but make it real
          </p>
          <h2 className="mt-4 font-display text-3xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
            Lock in.{' '}
            <span className="bg-gradient-to-r from-[#b3a6ff] via-[#f0abfc] to-[#fbbf24] bg-clip-text text-transparent">Together.</span>
          </h2>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-white/75 sm:text-base">
            No more studying alone at 2 am. Jump into a room, see who’s grinding the same course, and get it done side by
            side. Bring your friends and it’s a study date. 📚
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <InviteFriends />
            <span className="text-sm text-white/60">Free · no sound · nothing recorded</span>
          </div>
        </div>
        <div className="pb-14 lg:pb-6">
          <RoomPicture />
        </div>
      </div>

      <ul className="relative grid grid-cols-2 gap-3 px-4 pb-4 sm:px-10 sm:pb-10 lg:grid-cols-4">
        {VIBES.map((v) => (
          <li
            key={v.title}
            className={`group rounded-3xl border border-white/10 bg-gradient-to-br ${v.tint} to-white/[0.03] p-4 transition-transform sm:p-5 duration-300 hover:-translate-y-1`}
          >
            <span className="inline-block text-2xl transition-transform sm:text-3xl duration-300 group-hover:-rotate-6 group-hover:scale-110">{v.emoji}</span>
            <p className="mt-2 font-display text-[15px] font-semibold leading-snug sm:mt-3 sm:text-lg">{v.title}</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-white/70 sm:text-sm">{v.body}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
