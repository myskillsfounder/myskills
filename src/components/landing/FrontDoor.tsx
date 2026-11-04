import { Link } from '@tanstack/react-router'
import { Briefcase, ChevronRight, Globe2, GraduationCap, Users, type LucideIcon } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'

/*
 * What the front door says, on a phone (routes/welcome.tsx) and a computer
 * (routes/index.tsx) alike (Paul, 4 Nov 2026: "make the PC experience similar
 * to the one in mobile, same H1 and landing experience"): the students, the
 * headline, and the four cards in his order.
 *
 * Face photos: stock, free under the Unsplash License (no attribution
 * needed); credits: Fotos (unsplash.com/photos/TLdmnQz4Pns), Kyle Gregory
 * Devaras (6RTM8EsD1T8), Amit Ranjan (3S0Ucv4BDCk).
 */

const unsplash = (photo: string, w: number, h: number) =>
  `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=${w}&h=${h}&q=70`

const FACES = ['photo-1637589308599-3478cc55510d', 'photo-1514369118554-e20d93546b30', 'photo-1604177091072-b7b677a077f6']

export const FRONT_DOOR_LINE = 'Join a live study room, ask your doubts, and get it done together.'

/** Three faces and "Students across India, studying together". */
export function StudentsRow({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="flex -space-x-2">
        {FACES.map((f) => (
          <img key={f} src={unsplash(f, 64, 64)} alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-[#0b0a1f] sm:h-8 sm:w-8" />
        ))}
      </span>
      <span className="text-xs font-medium text-white/70 sm:text-sm">Students across India, studying together</span>
    </div>
  )
}

/** The headline's words; each page sets the size. */
export function FrontDoorHeadline() {
  return (
    <>
      <span className="bg-gradient-to-r from-[#b3a6ff] via-[#8f7bff] to-[#f0abfc] bg-clip-text text-transparent">Study online</span> with the
      biggest online community of learners
    </>
  )
}

type CardTo = '/internships' | '/community/internships' | '/mentors' | '/community/mentors' | '/become-a-partner-institution' | '/study-abroad'

type Tone = 'teal' | 'violet' | 'amber' | 'pink'

/** Each card's colour: the icon, a wash across the top, and the hover edge. */
const TONE: Record<Tone, { icon: string; wash: string; hover: string; link: string }> = {
  teal: { icon: 'from-teal-400 to-cyan-600', wash: 'from-teal-400/20', hover: 'hover:border-teal-300/50', link: 'text-teal-200' },
  violet: { icon: 'from-[#8f7bff] to-[#4f46e5]', wash: 'from-[#7b6cf6]/25', hover: 'hover:border-[#a99bff]/60', link: 'text-[#c9bfff]' },
  amber: { icon: 'from-amber-400 to-orange-500', wash: 'from-amber-400/20', hover: 'hover:border-amber-300/50', link: 'text-amber-200' },
  pink: { icon: 'from-pink-400 to-fuchsia-600', wash: 'from-pink-400/20', hover: 'hover:border-pink-300/50', link: 'text-pink-200' },
}

/** The support a student gets beyond the study room, in Paul's order:
 *  internships, mentors, institutions, study abroad. A visitor gets each
 *  one's public page; a student the real place. */
const CARDS: { title: string; short: string; body: string; cta: string; visitor: CardTo; student: CardTo; icon: LucideIcon; tone: Tone }[] = [
  {
    title: 'Internships',
    short: 'Real work with companies',
    body: 'Your first internship with a partner company: hands-on, real experience.',
    cta: 'Find internships',
    visitor: '/internships',
    student: '/community/internships',
    icon: Briefcase,
    tone: 'teal',
  },
  {
    title: 'Mentors',
    short: 'Guidance from people who know',
    body: '1:1 and group sessions with industry experts who guide your next step.',
    cta: 'Meet mentors',
    visitor: '/mentors',
    student: '/community/mentors',
    icon: Users,
    tone: 'violet',
  },
  {
    title: 'Institutions',
    short: 'MySkills at your college',
    body: 'Colleges and schools partner with MySkills to support their students.',
    cta: 'For institutions',
    visitor: '/become-a-partner-institution',
    student: '/become-a-partner-institution',
    icon: GraduationCap,
    tone: 'amber',
  },
  {
    title: 'Study Abroad',
    short: 'Partner universities worldwide',
    body: 'Guidance on partner universities, applications and test prep.',
    cta: 'Explore universities',
    visitor: '/study-abroad',
    student: '/study-abroad',
    icon: Globe2,
    tone: 'pink',
  },
]

/** "Plus the support every student gets": the four kinds of support. Compact
 *  on a phone (two by two, one line each); on a computer a row of four with a
 *  line and a link each (Paul, 4 Nov 2026: the photo cards looked low
 *  quality; "mention these as additional features or support students get"). */
export function FrontDoorCards({ signedIn = false, place }: { signedIn?: boolean; place: 'welcome' | 'home' }) {
  const compact = place === 'welcome'
  return (
    <div>
      <p className={`flex items-center gap-3 font-semibold uppercase tracking-[0.2em] text-white/55 ${compact ? 'text-[10px]' : 'justify-center text-xs'}`}>
        {!compact && <span className="h-px w-10 bg-gradient-to-r from-transparent to-white/30" />}
        Plus the support every student gets
        <span className={`h-px bg-gradient-to-r from-white/30 to-transparent ${compact ? 'flex-1' : 'w-10'}`} />
      </p>
      <ul className={`grid ${compact ? 'mt-3 grid-cols-2 gap-2.5' : 'mt-5 gap-4 sm:grid-cols-2 lg:grid-cols-4'}`}>
        {CARDS.map((c) => {
          const t = TONE[c.tone]
          return (
            <li key={c.title}>
              <Link
                to={signedIn ? c.student : c.visitor}
                onClick={() => trackEvent('front_door_card', { card: c.title, place, signed_in: signedIn })}
                className={`press group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-[border-color,transform] duration-300 ${t.hover} ${
                  compact ? 'p-3' : 'p-5 hover:-translate-y-1'
                }`}
              >
                <span aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b to-transparent ${t.wash}`} />
                <span
                  className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ring-1 ring-white/25 ${t.icon} ${
                    compact ? 'h-8 w-8' : 'h-11 w-11'
                  }`}
                >
                  <c.icon size={compact ? 16 : 20} />
                </span>
                <span className={`relative font-display font-semibold text-white ${compact ? 'mt-2.5 text-sm' : 'mt-4 text-lg'}`}>{c.title}</span>
                <span className={`relative text-white/65 ${compact ? 'mt-0.5 text-[11px] leading-snug' : 'mt-1.5 text-sm leading-relaxed'}`}>
                  {compact ? c.short : c.body}
                </span>
                {!compact && (
                  <span className={`relative mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold ${t.link}`}>
                    {c.cta} <ChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
