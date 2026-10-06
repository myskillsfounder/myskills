import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Briefcase,
  Building2,
  GraduationCap,
  HeartHandshake,
  UserPlus,
} from 'lucide-react'
import { useAuthUser } from '@/lib/useAuth'
import { AppShell } from '@/components/app/AppShell'
import { Skeleton } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { fetchMentors } from '@/lib/mentors'
import { PartnerHub } from '@/components/partner/PartnerHub'
import { fetchInstitutionPartners, type InstitutionPartner } from '@/lib/institutionPartners'
import { SearchHeader } from '@/components/community/SearchHeader'
import { useMyMatch, type StudentMatch } from '@/lib/mentorMatches'
import { rememberProgramme } from '@/lib/practiceProgramme'
import {
  CATEGORIES,
  INTERNSHIP_TRACKS,
  InstitutionListingCard,
  InternshipCard,
  JoinCard,
  MarketSection,
  marketGrid,
  MentorListingCard,
  SERVICES,
  ServiceCard,
  toMentorListing,
  type Category,
  type MentorListing,
} from '@/components/community/Marketplace'


// ?category=mentors (or wellness, guidance, internships, institutions) opens
// the hub already filtered, so a link elsewhere in the app can point at one
// kind of support. Anything else is ignored and shows everything.
export const Route = createFileRoute('/community/')({
  validateSearch: (s: Record<string, unknown>): { category?: Category } => ({
    category: CATEGORIES.some((c) => c.id === s.category && c.id !== 'all') ? (s.category as Category) : undefined,
  }),
  component: CommunityIndexRoute,
})

/**
 * /community is dual-purpose: signed-out visitors get the public partner
 * page (PartnerHub: its whole job is bringing mentors, counsellors, career
 * guides, institutions and companies to the partner sign-up — there is no
 * student-facing content there); onboarded users get the in-app hub below.
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
  return user ? <CommunityHub /> : <PartnerHub />
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

/** Searches worth suggesting, taken from what is actually listed so each one
 *  finds something: the skills most mentors share, then the cities
 *  institutions are in. */
function popularSearches(mentors: MentorListing[], institutions: InstitutionPartner[]): string[] {
  const tally = (words: (string | null | undefined)[]) => {
    const n = new Map<string, number>()
    for (const w of words) {
      const t = (w ?? '').trim()
      if (t.length >= 2 && t.length <= 24) n.set(t, (n.get(t) ?? 0) + 1)
    }
    return [...n.entries()].sort((a, b) => b[1] - a[1]).map(([w]) => w)
  }
  const skills = tally(mentors.flatMap((m) => m.expertise)).slice(0, 4)
  const cities = tally(institutions.map((p) => p.city)).slice(0, 2)
  return [...skills, ...cities, 'Internship']
}

/**
 * The student's own mentor, ahead of the directory: who they're working with
 * (or waiting to hear from) in each programme. Shown only when there is one —
 * a student without a mentor gets the listings, which is the way to find one.
 */
function YourMentors({ matches }: { matches: { match: StudentMatch | null; programme: 1 | 2; label: string }[] }) {
  const mine = matches.filter((m) => m.match && (m.match.status === 'active' || m.match.status === 'requested'))
  if (mine.length === 0) return null
  return (
    <section className="card p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">Your mentor</p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {mine.map(({ match, programme, label }) => {
          const name = match!.mentor?.full_name ?? 'Your mentor'
          const waiting = match!.status === 'requested'
          return (
            <li key={programme}>
              <Link
                to="/practice"
                onClick={() => rememberProgramme(programme)}
                className="group flex items-center gap-3 rounded-xl border border-ink-900/[0.08] p-3 transition-colors hover:border-brand-300"
              >
                {match!.mentor?.avatar_url ? (
                  <img src={match!.mentor.avatar_url} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800">
                    {name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink-900">{name}</span>
                  <span className="block truncate text-xs text-ink-500">
                    {label} · {waiting ? 'waiting for them to accept' : 'working with you'}
                  </span>
                </span>
                <ArrowRight size={15} className="shrink-0 text-ink-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" />
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function CommunityHub() {
  const { mentors, institutions, loading } = useMarketplaceData()
  const [query, setQuery] = useState('')
  // The category lives in the address, so a filtered view can be linked to,
  // shared, and survives a refresh; "All" is the bare /community.
  const { category: fromUrl } = Route.useSearch()
  const navigate = Route.useNavigate()
  const category: Category = fromUrl ?? 'all'
  const setCategory = (next: Category) =>
    void navigate({ search: { category: next === 'all' ? undefined : next }, replace: true })
  const q = query.trim().toLowerCase()
  const dmMatch = useMyMatch('digital-marketing')
  const crMatch = useMyMatch('career-readiness')

  const services = SERVICES.filter((s) => matches(q, s.title, s.who, s.body, s.tags))
  const wellness = services.filter((s) => s.category === 'wellness')
  const guidance = services.filter((s) => s.category === 'guidance')
  const mentorHits = mentors.filter((m) => matches(q, m.name, m.role, m.location, m.expertise, m.bio))
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
      <div className="space-y-7">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">Community</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            Find the Right Person for What You Need Next
          </h1>
        </header>

        {/* Search and categories lead the page and stay in reach while scrolling. */}
        <SearchHeader
          query={query}
          onQuery={setQuery}
          category={category}
          onCategory={setCategory}
          counts={loading ? {} : counts}
          popular={loading ? [] : popularSearches(mentors, institutions)}
          resultCount={loading ? null : category === 'all' ? (counts.all ?? 0) : (counts[category] ?? 0)}
        />

        {!q && category === 'all' && (
          <YourMentors
            matches={[
              { match: dmMatch.match, programme: 1, label: 'Digital Marketing' },
              { match: crMatch.match, programme: 2, label: 'Career Readiness' },
            ]}
          />
        )}

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

        {/* Mentors lead: a person to work with is what most students come here for. */}
        {visible('mentors', mentorHits.length) && (
          <MarketSection
            icon={GraduationCap}
            title="Mentors"
            subtitle="Marketers who’ve done the work — get feedback on yours and unblock your next step."
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
                    title={mentors.length ? 'Become a Mentor' : 'Be Our First Mentor'}
                    body="Done the work? Share what you know with students starting out."
                    to="/become-a-mentor"
                  />
                )}
              </div>
            )}
          </MarketSection>
        )}

        {supportServices.length > 0 && (
          <MarketSection
            icon={HeartHandshake}
            title="Wellness & Career Guidance"
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

        {visible('internships', internshipHits.length) && (
          <MarketSection
            icon={Briefcase}
            title="Upcoming Internships"
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
            title="Partner Institutions"
            subtitle="Verified training institutions for classroom and offline learning."
            seeAll={institutions.length ? { to: '/community/institutions', label: 'All Institutions' } : undefined}
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
                    title="List Your Institution"
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
