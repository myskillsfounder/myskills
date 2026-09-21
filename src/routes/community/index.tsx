import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  GraduationCap,
  HeartHandshake,
  Lock,
  UserPlus,
  Users,
} from 'lucide-react'
import { useAuthUser } from '@/lib/useAuth'
import { AppShell } from '@/components/app/AppShell'
import { Badge, Skeleton } from '@/components/ui'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { supabase } from '@/lib/supabase'
import { fetchMentors } from '@/lib/mentors'
import { fetchInstitutionPartners, type InstitutionPartner } from '@/lib/institutionPartners'
import {
  CategoryBar,
  INTERNSHIP_TRACKS,
  InstitutionListingCard,
  InternshipCard,
  JoinCard,
  MarketplaceHero,
  MarketSection,
  marketGrid,
  MentorListingCard,
  SERVICES,
  ServiceCard,
  toMentorListing,
  type Category,
  type MentorListing,
} from '@/components/community/Marketplace'

type IconType = ComponentType<{ size?: number; className?: string }>

export const Route = createFileRoute('/community/')({
  component: CommunityIndexRoute,
})

/**
 * /community is dual-purpose: signed-out visitors get this public marketing
 * page (its main job is funneling mentor applicants to /become-a-mentor);
 * onboarded users get the in-app hub below.
 *
 * Defaults to the public page immediately, even while auth is still
 * resolving, and only swaps to the hub once a session is confirmed. A
 * blank, nav-less placeholder here used to be the alternative -- but that
 * meant every single visit to this route had a real window with NO navbar
 * in the DOM at all (every other public page renders its Navbar
 * immediately). A click landing in that window, or right as the blank div
 * got swapped for real content, hit nothing -- which is exactly the
 * intermittent "clicks don't work" pattern reported on this page. A signed-
 * in visitor sees a brief flash of the public page before the swap; that's
 * a much smaller cost than a page with no working navigation.
 */
function CommunityIndexRoute() {
  const { user } = useAuthUser()
  return user ? <CommunityHub /> : <PublicCommunityPage />
}

const primaryButton =
  'press inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700'

const secondaryButton =
  'press inline-flex items-center justify-center gap-2 rounded-full border border-ink-200 px-6 py-3 text-sm font-semibold text-ink-900 transition-colors hover:border-ink-300'

const notifyButton =
  'press inline-flex items-center justify-center gap-2 rounded-full border border-ink-200 bg-white px-6 py-3 text-sm font-semibold text-ink-900 transition-colors hover:border-ink-300'

/** Three-pillar "at a glance" preview row, under the hero copy. Mirrors the
 *  checkmark row on the homepage Hero, but foreshadows the sections below
 *  instead of restating the value prop. */
function PillarPreview({ icon: Icon, label }: { icon: IconType; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon size={16} className="text-brand-600" />
      {label}
    </span>
  )
}

/** The compact overview card for each pillar — same shape for all three, so
 *  the "this is one community with three parts" read comes from consistency,
 *  not from any one of them dominating. */
function PillarCard({
  icon: Icon,
  live,
  title,
  description,
  action,
}: {
  icon: IconType
  live: boolean
  title: string
  description: string
  action: ReactNode
}) {
  return (
    <div className={`card lift group flex flex-col p-6 ${live ? '' : 'hover:!translate-y-0 hover:!shadow-none'}`}>
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-e1 transition-transform duration-300 ${
            live
              ? 'bg-gradient-to-br from-brand-500 to-brand-700 group-hover:scale-105'
              : 'bg-gradient-to-br from-ink-400 to-ink-600 opacity-70 grayscale'
          }`}
        >
          <Icon size={22} />
        </span>
        {live ? (
          <Badge tone="success">Available</Badge>
        ) : (
          <Badge tone="neutral" icon={Lock}>
            Coming soon
          </Badge>
        )}
      </div>

      <h3 className="mt-4 font-display text-lg font-semibold text-ink-900">{title}</h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-600">{description}</p>

      <div className="mt-4">{action}</div>
    </div>
  )
}

/** Full-width deep-dive section shared by all three pillars. `live` swaps the
 *  colorful, actionable treatment for the honest muted "coming soon" one —
 *  same structure either way, so nothing feels like an afterthought. */
function PillarSection({
  icon: Icon,
  live,
  reverse = false,
  eyebrow,
  title,
  description,
  bullets,
  actions,
}: {
  icon: IconType
  live: boolean
  /** Alternates which side the text sits on down the page, so three
   *  back-to-back sections don't read as one repeated block. */
  reverse?: boolean
  eyebrow: string
  title: string
  description: string
  bullets: string[]
  actions: ReactNode
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
      <div
        className={`grid items-center gap-10 rounded-2xl border p-8 lg:grid-cols-2 lg:p-12 ${
          live ? 'border-brand-100 bg-brand-50/60' : 'border-ink-100 bg-ink-50/60'
        }`}
      >
        <div className={reverse ? 'lg:order-2' : ''}>
          <div className="flex items-center gap-3">
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-e1 ${
                live
                  ? 'bg-gradient-to-br from-brand-500 to-brand-700'
                  : 'bg-gradient-to-br from-ink-400 to-ink-600 opacity-70 grayscale'
              }`}
            >
              <Icon size={22} />
            </span>
            {!live && (
              <Badge tone="neutral" icon={Lock}>
                Coming soon
              </Badge>
            )}
          </div>

          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            {title}
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-600">{description}</p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">{actions}</div>
        </div>

        <ul className={`space-y-3.5 ${reverse ? 'lg:order-1' : ''}`}>
          {bullets.map((line) => (
            <li key={line} className="flex items-start gap-2.5 text-sm text-ink-700">
              <CheckCircle2
                size={18}
                className={`mt-0.5 shrink-0 ${live ? 'text-brand-600' : 'text-ink-400'}`}
              />
              {line}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function PublicCommunityPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pt-10 pb-10 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
              <Users size={13} />
              Community
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-5xl">
              Learn alongside people{' '}
              <span className="text-brand-600">who've done it</span>
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-ink-500 sm:text-lg">
              Mentors for feedback, internships for real experience, institutions
              for the classroom — one community around every way to actually get
              good at marketing.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-500">
              <PillarPreview icon={GraduationCap} label="Mentors" />
              <PillarPreview icon={Briefcase} label="Real work experience" />
              <PillarPreview icon={Building2} label="Offline learning" />
            </div>
          </div>
        </section>

        {/* Three pillars, at a glance */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <PillarCard
              icon={GraduationCap}
              live
              title="Mentors"
              description="Marketers who've done the work, answering questions and reviewing yours in live chat."
              action={
                <Link
                  to="/community/mentors"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700"
                >
                  Meet the mentors
                  <ArrowRight size={15} />
                </Link>
              }
            />
            <PillarCard
              icon={Building2}
              live
              title="Institutions"
              description="Training institutions verified as MySkills partners for offline learning — or apply if that's you."
              action={
                <Link
                  to="/become-a-partner-institution"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700"
                >
                  Apply to partner
                  <ArrowRight size={15} />
                </Link>
              }
            />
            <PillarCard
              icon={Briefcase}
              live={false}
              title="Internships"
              description="Real internships with partner companies, so your practice turns into work experience you can actually show."
              action={<p className="text-sm font-medium text-ink-400">Opening soon</p>}
            />
          </div>
        </section>

        {/* Mentors — the live pillar */}
        <PillarSection
          icon={GraduationCap}
          live
          eyebrow="Available now"
          title="Become a mentor"
          description="Students across India use MySkills to build real digital marketing skills. If you've done the work, a little of your time goes a long way — no learner account needed, just a few minutes to apply."
          bullets={[
            'Answer questions and unblock students in live support chat',
            'Get featured on your profile with a verified mentor badge',
            'Shape what a career in digital marketing actually looks like',
          ]}
          actions={
            <>
              <Link to="/become-a-mentor" className={primaryButton}>
                Apply to mentor
                <ArrowRight size={16} />
              </Link>
              <Link to="/community/mentors" className={secondaryButton}>
                Meet current mentors
              </Link>
            </>
          }
        />

        {/* Institutions — open partner program */}
        <PillarSection
          icon={Building2}
          live
          reverse
          eyebrow="Open to institutions"
          title="Partner with MySkills"
          description="Run digital marketing courses or training programs? Get listed as a verified MySkills partner institution so our students know who to trust for offline or classroom learning."
          bullets={[
            'A verified listing your prospective students can find and trust',
            'Built on the same MySkills tracks your students can already practice',
            'A guided path from practice scores to real classroom coaching',
          ]}
          actions={
            <>
              <Link to="/become-a-partner-institution" className={primaryButton}>
                Apply to partner
                <ArrowRight size={16} />
              </Link>
              <Link to="/community/institutions" className={secondaryButton}>
                See partner institutions
              </Link>
            </>
          }
        />

        {/* Internships — real work experience, scheduled for later so it goes last */}
        <PillarSection
          icon={Briefcase}
          live={false}
          eyebrow="Coming soon"
          title="Internships with partner companies"
          description="Practice scenarios prove you know the theory. This is where you prove you can do the job — real internship briefs from companies, scored and reviewed like the work it is."
          bullets={[
            'Work real internship briefs, not hypotheticals',
            'Build a portfolio piece you can actually show in interviews',
            "Get matched by the skill tracks you've already proven",
          ]}
          actions={
            <Link to="/signup" className={notifyButton}>
              Create a free account
              <ArrowRight size={16} />
            </Link>
          }
        />

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-ink-900 px-6 py-10 sm:flex-row sm:items-center sm:px-10">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Not mentoring yet? Start as a student.
              </h2>
              <p className="mt-2 max-w-md text-sm text-ink-300 sm:text-base">
                Create a free account to take the assessment and talk to mentors
                yourself.
              </p>
            </div>
            <Link
              to="/signup"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-500 sm:w-auto"
            >
              Get started free
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

/**
 * The signed-in Community, laid out as a marketplace: one search and one set
 * of category chips over every kind of support — wellness, career guidance,
 * mentors, internships and partner institutions. Mentors and institutions
 * are real listings; wellness and guidance are requests read by the team;
 * internships show the roles they'll open in, never invented companies.
 */
type MentorProfileRow = NonNullable<Parameters<typeof toMentorListing>[1]> & { id: string }

function useMarketplaceData() {
  const [mentors, setMentors] = useState<MentorListing[]>([])
  const [institutions, setInstitutions] = useState<InstitutionPartner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const loadMentors = fetchMentors().then(async (list) => {
      const ids = list.map((m) => m.profile_id).filter((id): id is string => Boolean(id))
      const byId: Record<string, MentorProfileRow> = {}
      if (ids.length) {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, headline, avatar_url, location, skills')
          .in('id', ids)
        for (const r of (data ?? []) as MentorProfileRow[]) byId[r.id] = r
      }
      if (active) setMentors(list.map((m) => toMentorListing(m, m.profile_id ? byId[m.profile_id] : undefined)))
    })
    const loadInstitutions = fetchInstitutionPartners().then((list) => {
      if (active) setInstitutions(list)
    })
    // A failed list just shows as empty — the rest of the marketplace still works.
    Promise.allSettled([loadMentors, loadInstitutions]).then(() => {
      if (active) setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  return { mentors, institutions, loading }
}

const matches = (q: string, ...fields: (string | null | undefined | string[])[]) =>
  !q || fields.some((f) => (Array.isArray(f) ? f.join(' ') : (f ?? '')).toLowerCase().includes(q))

function ListingSkeletons() {
  return (
    <div className={marketGrid}>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-44 w-full rounded-2xl" />
      ))}
    </div>
  )
}

function HowSupportWorks() {
  const steps = [
    'Send a private request — only the MySkills team can see it.',
    'A real person reads it, never a bot.',
    'We reach out by email or phone, at your pace.',
  ]
  return (
    <div className="flex flex-col justify-center rounded-2xl bg-ink-900/[0.03] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">How it works</p>
      <ol className="mt-3 space-y-3">
        {steps.map((s, i) => (
          <li key={s} className="flex items-start gap-3 text-sm leading-relaxed text-ink-700">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-ink-900 ring-1 ring-ink-900/[0.08]">
              {i + 1}
            </span>
            {s}
          </li>
        ))}
      </ol>
    </div>
  )
}

function CommunityHub() {
  const { mentors, institutions, loading } = useMarketplaceData()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category>('all')
  const q = query.trim().toLowerCase()

  const services = SERVICES.filter((s) => matches(q, s.title, s.who, s.body, s.tags))
  const wellness = services.filter((s) => s.category === 'wellness')
  const guidance = services.filter((s) => s.category === 'guidance')
  const mentorHits = mentors.filter((m) => matches(q, m.name, m.role, m.location, m.expertise))
  const internshipHits = INTERNSHIP_TRACKS.filter((t) => matches(q, t.title, t.body, t.skills))
  const institutionHits = institutions.filter((p) => matches(q, p.legal_name, p.city, p.courses_offered))

  const counts: Partial<Record<Category, number>> = {
    wellness: wellness.length,
    guidance: guidance.length,
    mentors: mentorHits.length,
    internships: internshipHits.length,
    institutions: institutionHits.length,
  }
  counts.all = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0)

  const show = (c: Category) => category === 'all' || category === c
  // While searching, a section with nothing to show gets out of the way;
  // without a search it stays, so an empty list reads as "none yet".
  const visible = (c: Category, n: number) => show(c) && (!q || n > 0)
  const supportServices = [...(show('wellness') ? wellness : []), ...(show('guidance') ? guidance : [])]
  const nothing =
    Boolean(q) && !loading && (category === 'all' ? counts.all === 0 : (counts[category] ?? 0) === 0)

  return (
    <AppShell wide>
      <div className="space-y-8">
        <MarketplaceHero
          query={query}
          onQuery={setQuery}
          stats={[
            { label: 'Verified mentors', value: loading ? '—' : String(mentors.length) },
            { label: 'Partner institutions', value: loading ? '—' : String(institutions.length) },
            { label: 'Counsellors & career guides', value: 'Free' },
            { label: 'Internships', value: 'Opening soon' },
          ]}
        />

        <CategoryBar active={category} onChange={setCategory} counts={loading ? {} : counts} />

        {nothing && (
          <div className="card p-8 text-center">
            <p className="font-display text-lg font-semibold text-ink-900">Nothing matches “{query.trim()}”</p>
            <p className="mt-1 text-sm text-ink-600">Try a skill like “SEO”, a city, or a broader word.</p>
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setCategory('all')
              }}
              className="mt-4 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Clear search
            </button>
          </div>
        )}

        {supportServices.length > 0 && (
          <MarketSection
            icon={HeartHandshake}
            title="Wellness & career guidance"
            subtitle="For the moments practice alone can’t fix — overwhelm, self-doubt, or not knowing what’s next."
          >
            <div className={marketGrid}>
              {supportServices.map((s) => (
                <ServiceCard key={s.id} service={s} />
              ))}
              <HowSupportWorks />
            </div>
          </MarketSection>
        )}

        {visible('mentors', mentorHits.length) && (
          <MarketSection
            icon={GraduationCap}
            title="Mentors"
            subtitle="Marketers who’ve done the work — get feedback on yours and unblock your next step."
            seeAll={mentors.length ? { to: '/community/mentors', label: 'All mentors' } : undefined}
          >
            {loading ? (
              <ListingSkeletons />
            ) : (
              <div className={marketGrid}>
                {mentorHits.map((m) => (
                  <MentorListingCard key={m.id} mentor={m} />
                ))}
                {!q && (
                  <JoinCard
                    icon={UserPlus}
                    title={mentors.length ? 'Become a mentor' : 'Be our first mentor'}
                    body="Done the work? Share what you know with students starting out."
                    to="/become-a-mentor"
                  />
                )}
              </div>
            )}
          </MarketSection>
        )}

        {visible('internships', internshipHits.length) && (
          <MarketSection
            icon={Briefcase}
            title="Upcoming internships"
            subtitle="Real work with partner companies — the step that turns practice into experience you can show."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {internshipHits.map((t) => (
                <InternshipCard key={t.title} track={t} />
              ))}
            </div>
          </MarketSection>
        )}

        {visible('institutions', institutionHits.length) && (
          <MarketSection
            icon={Building2}
            title="Partner institutions"
            subtitle="Verified training institutions for classroom and offline learning."
            seeAll={institutions.length ? { to: '/community/institutions', label: 'All institutions' } : undefined}
          >
            {loading ? (
              <ListingSkeletons />
            ) : (
              <div className={marketGrid}>
                {institutionHits.map((p) => (
                  <InstitutionListingCard key={p.id} partner={p} />
                ))}
                {!q && (
                  <JoinCard
                    icon={Building2}
                    title="List your institution"
                    body="Run digital marketing courses? Apply to become a verified partner."
                    to="/become-a-partner-institution"
                  />
                )}
              </div>
            )}
          </MarketSection>
        )}
      </div>
    </AppShell>
  )
}
