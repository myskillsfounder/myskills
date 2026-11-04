import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Briefcase, ChevronRight, ChevronUp, Globe2, GraduationCap, MessageCircleQuestion, MicOff, Users, Video, type LucideIcon } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'
import { requirePhoneWelcome } from '@/lib/guards'

/**
 * The phone's front door, for someone signed out (Paul, 4 Nov 2026: the bare
 * headline "looks plain, give the user a vibe to study online"). A student at
 * their desk fills the top of the screen, with what a study room feels like
 * floating over it: live, camera on, no sound, doubts upvoted. Then the
 * headline and one thing to do. "Study Online" signs them up, and a new
 * account lands in Study rooms (lib/device.ts). Anyone signed in is sent on
 * by the guard.
 *
 * Photos: stock, free under the Unsplash License (no attribution needed);
 * credits: Vikas Makwana (unsplash.com/photos/upn798iEEYM), Fotos
 * (TLdmnQz4Pns), Kyle Gregory Devaras (6RTM8EsD1T8), Amit Ranjan (3S0Ucv4BDCk).
 */
export const Route = createFileRoute('/welcome')({
  beforeLoad: requirePhoneWelcome,
  component: WelcomePage,
})

const unsplash = (photo: string, w: number, h: number) =>
  `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=${w}&h=${h}&q=70`

const HERO = 'photo-1617009762269-c062aaf6b3a0'
const FACES = ['photo-1637589308599-3478cc55510d', 'photo-1514369118554-e20d93546b30', 'photo-1604177091072-b7b677a077f6']

/** What else MySkills is, under the headline, in Paul's order (4 Nov 2026):
 *  internships, mentors, institutions, study abroad. Each is a public page a
 *  signed-out phone can open. */
const CARDS: { title: string; body: string; to: string; photo: string; icon: LucideIcon }[] = [
  { title: 'Internships', body: 'Real work with companies', to: '/internships', photo: '/home/card-career.webp', icon: Briefcase },
  { title: 'Mentors', body: 'Guidance from people who know', to: '/mentors', photo: '/home/card-mentorship.webp', icon: Users },
  { title: 'Institutions', body: 'Bring MySkills to your college', to: '/become-a-partner-institution', photo: '/home/institutions.webp', icon: GraduationCap },
  { title: 'Study Abroad', body: 'Partner universities worldwide', to: '/study-abroad', photo: '/home/card-study-abroad.webp', icon: Globe2 },
]

function MoreCards() {
  return (
    <ul className="mt-6 grid grid-cols-2 gap-2.5">
      {CARDS.map((c) => (
        <li key={c.title}>
          <Link
            to={c.to}
            onClick={() => trackEvent('welcome_card', { card: c.title })}
            className="press group relative flex h-32 flex-col justify-end overflow-hidden rounded-2xl p-3 ring-1 ring-white/15"
          >
            <img src={c.photo} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute inset-0 bg-gradient-to-t from-[#0b0a1f] via-[#0b0a1f]/60 to-[#0b0a1f]/10" />
            <span className="absolute left-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#7b6cf6] to-[#4f46e5] text-white ring-1 ring-white/20">
              <c.icon size={14} />
            </span>
            <span className="relative flex items-center gap-0.5 text-sm font-semibold text-white">
              {c.title} <ChevronRight size={14} className="text-white/60" />
            </span>
            <span className="relative mt-0.5 text-[11px] leading-snug text-white/70">{c.body}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

/** A frosted card floating over the photo. */
function Chip({ className = '', delay = '0s', children }: { className?: string; delay?: string; children: React.ReactNode }) {
  return (
    <div
      aria-hidden
      className={`float-y absolute rounded-2xl bg-[#100e26]/65 px-3 py-2 text-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] ring-1 ring-white/15 backdrop-blur-md ${className}`}
      style={{ animationDelay: delay }}
    >
      {children}
    </div>
  )
}

function WelcomePage() {
  return (
    <div className="relative min-h-[100dvh] overflow-x-clip bg-[#0b0a1f]">
      {/* The photo, fading into the page */}
      <div className="absolute inset-x-0 top-0 h-[60dvh] min-h-[22rem]">
        <img
          src={unsplash(HERO, 750, 1000)}
          alt="A student studying at a desk"
          className="h-full w-full object-cover"
          style={{ objectPosition: '60% 30%' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_85%,rgba(106,85,230,0.35),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0a1f]/70 via-transparent via-55% to-[#0b0a1f]" />

        <Chip className="left-4 top-[22%]">
          <span className="flex items-center gap-2 text-xs font-semibold">
            <span className="live-ping relative h-2 w-2 rounded-full bg-emerald-400 text-emerald-400" /> Study room · Live
          </span>
        </Chip>
        <Chip className="right-4 top-[40%] max-w-[13.5rem]" delay="-1.6s">
          <span className="flex items-start gap-2">
            <MessageCircleQuestion size={15} className="mt-0.5 shrink-0 text-amber-200" />
            <span className="text-xs leading-snug text-white/90">“How do I revise a whole chapter in an hour?”</span>
          </span>
          <span className="mt-1.5 inline-flex items-center gap-0.5 rounded-full bg-amber-400/25 px-2 py-0.5 text-[10px] font-semibold text-amber-100">
            <ChevronUp size={12} /> Upvote
          </span>
        </Chip>
        <Chip className="bottom-[16%] left-4" delay="-3.2s">
          <span className="flex items-center gap-2.5 text-xs font-medium text-white/90">
            <Video size={14} className="text-[#a99bff]" /> Camera on
            <span className="h-3 w-px bg-white/25" />
            <MicOff size={14} className="text-[#a99bff]" /> No sound
          </span>
        </Chip>
      </div>

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pt-6">
        <header className="flex items-center justify-between">
          <span className="font-display text-lg font-semibold tracking-tight text-white">MySkills</span>
          <Link to="/login" className="rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur">
            Log In
          </Link>
        </header>

        <main className="flex flex-1 flex-col justify-end pb-2 pt-[45dvh]">
          <div className="flex items-center gap-2.5">
            <span className="flex -space-x-2">
              {FACES.map((f) => (
                <img key={f} src={unsplash(f, 64, 64)} alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-[#0b0a1f]" />
              ))}
            </span>
            <span className="text-xs font-medium text-white/70">Students across India, studying together</span>
          </div>
          <h1 className="mt-3 font-display text-[2.25rem] font-semibold leading-[1.08] tracking-tight text-white">
            <span className="bg-gradient-to-r from-[#b3a6ff] via-[#8f7bff] to-[#f0abfc] bg-clip-text text-transparent">Study online</span> with the
            biggest online community of learners
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/70">Join a live study room, ask your doubts, and get it done together.</p>
          <MoreCards />
        </main>

        <footer className="sticky bottom-0 -mx-5 space-y-2 bg-gradient-to-t from-[#0b0a1f] via-[#0b0a1f]/95 to-transparent px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-5">
          <Link
            to="/signup"
            onClick={() => trackEvent('welcome_cta', { cta: 'study_online' })}
            className="press flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7b6cf6] to-[#4f46e5] text-lg font-bold text-white shadow-[0_10px_30px_-8px_rgba(123,108,246,0.8)]"
          >
            Study Online <ArrowRight size={20} />
          </Link>
          <p className="text-center text-xs text-white/60">Free. Sign up in seconds with Google or your email.</p>
        </footer>
      </div>
    </div>
  )
}
