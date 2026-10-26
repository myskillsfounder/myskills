import { homeEntry } from '@/lib/guards'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Briefcase, Heart, Plane, Sparkles, Target, Users, type LucideIcon } from 'lucide-react'
import { useAuthUser } from '@/lib/useAuth'
import { trackEvent } from '@/lib/analytics'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

export const Route = createFileRoute('/')({
  beforeLoad: homeEntry,
  component: HomePage,
})

/*
 * The home page of the standard website: "Learning centred around the
 * student", with Paul's own platform artwork (26 Oct 2026), cropped to the
 * partners and the student with the five pillars (public/home/platform.webp;
 * the picture's B2B and revenue parts are not on the student site). Every card
 * in the artwork is a real link over the picture, and its words are on the
 * page as text for search engines and screen readers.
 */

type To = '/courses' | '/signup' | '/community' | '/study-abroad'

interface Spot {
  label: string
  /** Where the card sits on the artwork, in percent of its width and height. */
  at: { left: number; top: number; width: number; height: number }
  visitor: { to: To; search?: Record<string, unknown> }
  student?: { to: To; search?: Record<string, unknown> }
}

const PARTNERS_HUB = { to: '/community' as const, search: { partners: true } }

const SPOTS: Spot[] = [
  // Our partners & providers (left).
  { label: 'Institutions: colleges, training institutes, skill centres', at: { left: 0.3, top: 7.1, width: 32.9, height: 15 }, visitor: PARTNERS_HUB },
  { label: 'Mentors: industry experts, professionals, coaches', at: { left: 0.3, top: 24.2, width: 32.9, height: 16.6 }, visitor: PARTNERS_HUB },
  { label: 'Study abroad partners: universities, consultants, overseas education providers', at: { left: 0.3, top: 42.7, width: 32.9, height: 17.7 }, visitor: PARTNERS_HUB },
  { label: 'Career partners: companies, internship providers, hiring partners', at: { left: 0.3, top: 62.2, width: 32.9, height: 17.1 }, visitor: PARTNERS_HUB },
  { label: 'Wellness and mental health partners: therapists, counsellors, wellness platforms', at: { left: 0.3, top: 81.4, width: 32.9, height: 18.6 }, visitor: PARTNERS_HUB },
  // The student and the five pillars (right).
  { label: 'Learning programmes: courses, certifications, micro-learning', at: { left: 48.4, top: 16.3, width: 14.9, height: 24.3 }, visitor: { to: '/courses' } },
  { label: 'Mentorship: 1:1 and group sessions with industry experts', at: { left: 82.6, top: 16.3, width: 14.7, height: 24.5 }, visitor: { to: '/signup' }, student: { to: '/community', search: { category: 'mentors' } } },
  { label: 'Study abroad: university guidance, applications, test prep', at: { left: 47.8, top: 46.6, width: 13.7, height: 24.2 }, visitor: { to: '/signup' }, student: { to: '/study-abroad' } },
  { label: 'Career guidance: career counselling, job and internship opportunities', at: { left: 84.3, top: 46.6, width: 13.4, height: 24.5 }, visitor: { to: '/signup' }, student: { to: '/community', search: { category: 'internships' } } },
  { label: 'Wellness and mental health: counselling, workshops, wellness resources', at: { left: 60.9, top: 76.6, width: 23.7, height: 20.1 }, visitor: { to: '/signup' }, student: { to: '/community', search: { category: 'wellness' } } },
  { label: 'The student: learn, get guidance, build skills, grow. Start with a course', at: { left: 64, top: 20.5, width: 18.2, height: 45.8 }, visitor: { to: '/courses' } },
]

const BENEFITS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Target, title: 'Free aptitude test', body: 'Know your strengths before you start a course.' },
  { icon: Sparkles, title: 'An AI coach', body: 'Short modules and real scenarios, with feedback.' },
  { icon: Users, title: 'A real mentor', body: 'Guidance, sessions and a project they grade.' },
  { icon: Briefcase, title: 'Your first internship', body: 'Hands-on, real experience with a partner company.' },
  { icon: Plane, title: 'Study abroad support', body: 'Partner universities and application help.' },
  { icon: Heart, title: 'Wellness support', body: 'Someone to talk to, privately, when you need it.' },
]

function HomePage() {
  const { user } = useAuthUser()
  const signedIn = Boolean(user)

  return (
    <div className="min-h-screen bg-[#0b0a1c]">
      <Navbar />

      <main className="relative overflow-hidden bg-[#0b0a1c] bg-[radial-gradient(60rem_40rem_at_60%_60%,rgba(108,92,231,0.20),transparent_70%),radial-gradient(40rem_30rem_at_100%_0%,rgba(143,133,238,0.12),transparent_70%)]">
        {/* The page opens on the artwork (Paul, 26 Oct 2026); the heading stays
            for search engines and screen readers, not on screen. */}
        <h1 className="sr-only">Learning centred around the student: MySkills, the student development platform</h1>

        {/* The platform artwork, with each card a link over it. */}
        <section className="relative mx-auto max-w-[72rem] px-4 pt-10 sm:px-6 sm:pt-14 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: '1095 / 633' }}>
            <img
              src="/home/platform.webp"
              alt="MySkills, the student development platform: our partners and providers (institutions, mentors, study abroad partners, career partners and wellness partners) bring content, services and opportunities to the student, who is at the centre of learning programmes, mentorship, study abroad, career guidance and wellness and mental health."
              width={1095}
              height={633}
              className="absolute inset-0 h-full w-full select-none"
              draggable={false}
            />
            {SPOTS.map((s) => {
              const target = (signedIn && s.student) || s.visitor
              return (
                <Link
                  key={s.label}
                  to={target.to}
                  search={target.search as never}
                  aria-label={s.label}
                  title={s.label.split(':')[0]}
                  onClick={() => trackEvent('home_artwork', { card: s.label.split(':')[0], signed_in: signedIn })}
                  className="absolute rounded-2xl outline-none ring-brand-200/70 transition-[box-shadow,background-color] hover:bg-white/[0.04] hover:ring-2 focus-visible:ring-2"
                  style={{ left: `${s.at.left}%`, top: `${s.at.top}%`, width: `${s.at.width}%`, height: `${s.at.height}%` }}
                />
              )
            })}
          </div>
          <p className="mt-3 text-center text-sm text-white/50">Tap any card to explore it.</p>
        </section>

        {/* What a student gets. */}
        <section className="relative mx-auto max-w-[72rem] px-4 pb-20 pt-14 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-display text-3xl font-bold text-white">For you</p>
              <p className="mt-1 text-white/70">Everything a student gets, free to start</p>
            </div>
            <Link to="/community" search={{ partners: true }} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-200 hover:text-white">
              Partner with MySkills <ArrowRight size={15} />
            </Link>
          </div>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b, i) => (
              <li
                key={b.title}
                className="flex items-center gap-4 rounded-2xl border border-brand-300/20 bg-[#151233]/80 p-4 shadow-[0_0_40px_-14px_rgba(143,133,238,0.55)]"
              >
                <span className="font-display text-2xl font-bold text-brand-300">0{i + 1}</span>
                <b.icon size={24} className="shrink-0 text-white" />
                <span>
                  <span className="block font-semibold text-white">{b.title}</span>
                  <span className="mt-0.5 block text-sm text-white/60">{b.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <Footer />
    </div>
  )
}
