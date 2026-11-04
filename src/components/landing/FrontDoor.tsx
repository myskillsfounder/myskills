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

/** In Paul's order: internships, mentors, institutions, study abroad. A
 *  visitor gets each one's public page; a student the real place. */
const CARDS: { title: string; body: string; visitor: CardTo; student: CardTo; photo: string; icon: LucideIcon }[] = [
  { title: 'Internships', body: 'Real work with companies', visitor: '/internships', student: '/community/internships', photo: '/home/card-career.webp', icon: Briefcase },
  { title: 'Mentors', body: 'Guidance from people who know', visitor: '/mentors', student: '/community/mentors', photo: '/home/card-mentorship.webp', icon: Users },
  { title: 'Institutions', body: 'Bring MySkills to your college', visitor: '/become-a-partner-institution', student: '/become-a-partner-institution', photo: '/home/institutions.webp', icon: GraduationCap },
  { title: 'Study Abroad', body: 'Partner universities worldwide', visitor: '/study-abroad', student: '/study-abroad', photo: '/home/card-study-abroad.webp', icon: Globe2 },
]

/** The four cards: two by two on a phone, one row of four on a computer. */
export function FrontDoorCards({ signedIn = false, place }: { signedIn?: boolean; place: 'welcome' | 'home' }) {
  return (
    <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-4">
      {CARDS.map((c) => (
        <li key={c.title}>
          <Link
            to={signedIn ? c.student : c.visitor}
            onClick={() => trackEvent('front_door_card', { card: c.title, place, signed_in: signedIn })}
            className="press group relative flex h-32 flex-col justify-end overflow-hidden rounded-2xl p-3 text-left ring-1 ring-white/15 transition-shadow hover:ring-[#8f7bff]/60 sm:h-44 sm:p-4"
          >
            <img
              src={c.photo}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-[#0b0a1f] via-[#0b0a1f]/60 to-[#0b0a1f]/10" />
            <span className="absolute left-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#7b6cf6] to-[#4f46e5] text-white ring-1 ring-white/20 sm:left-3.5 sm:top-3.5 sm:h-9 sm:w-9">
              <c.icon size={16} />
            </span>
            <span className="relative flex items-center gap-0.5 text-sm font-semibold text-white sm:text-base">
              {c.title} <ChevronRight size={14} className="text-white/60 transition-transform group-hover:translate-x-0.5" />
            </span>
            <span className="relative mt-0.5 text-[11px] leading-snug text-white/70 sm:text-[13px]">{c.body}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
