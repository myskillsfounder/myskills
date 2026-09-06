import type { ComponentType, ReactNode } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  GraduationCap,
  Lock,
  Users,
} from 'lucide-react'
import { useAuthUser } from '@/lib/useAuth'
import { AppShell } from '@/components/app/AppShell'
import { Badge, PageHeader } from '@/components/ui'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { IntervalPromoCard } from '@/components/community/IntervalPromoCard'

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
              icon={Briefcase}
              live={false}
              title="Internships"
              description="Real internships with partner companies, so your practice turns into work experience you can actually show."
              action={<p className="text-sm font-medium text-ink-400">Opening soon</p>}
            />
            <PillarCard
              icon={Building2}
              live
              title="Institutions"
              description="INTERVAL, our exclusive offline partner, runs in-person digital marketing training built on the same MySkills tracks."
              action={
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700"
                >
                  Book a demo
                  <ArrowRight size={15} />
                </Link>
              }
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

        {/* Internships — real work experience */}
        <PillarSection
          icon={Briefcase}
          live={false}
          reverse
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

        {/* Institutions — offline learning with our exclusive partner */}
        <PillarSection
          icon={Building2}
          live
          eyebrow="Exclusive offline partner"
          title="Institutions — offline sessions with INTERVAL"
          description="INTERVAL is MySkills' exclusive offline training partner — the same skill tracks and assessments you practice here, taught in person for your cohort."
          bullets={[
            "Instructor-led offline sessions, run by INTERVAL's trainers",
            'Built on the MySkills tracks your students have already practiced',
            'A personalised pace, tailored to where each student is starting from',
          ]}
          actions={
            <Link to="/signup" className={primaryButton}>
              Create a free account to book a demo
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

/** The signed-in, onboarded experience — unchanged from before /community
 *  became dual-purpose. */
/** One tile in the signed-in hub. Live pillars are the whole-card link
 *  itself (this is the primary nav surface for the section, unlike the
 *  public page where the card is just a preview); locked pillars fade to
 *  grayscale with the same shape, so all three read as one set. */
function HubTile({
  icon: Icon,
  live,
  title,
  description,
  to,
  ctaLabel,
  lockedNote,
}: {
  icon: IconType
  live: boolean
  title: string
  description: string
  to?: string
  ctaLabel?: string
  lockedNote?: string
}) {
  const body = (
    <>
      <div className="relative flex items-start justify-between gap-3">
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

      <h2 className="relative mt-4 font-display text-xl font-semibold text-ink-900">{title}</h2>
      <p className="relative mt-1.5 flex-1 text-sm leading-relaxed text-ink-600">{description}</p>

      {live ? (
        <span className="relative mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
          {ctaLabel}
          <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      ) : (
        <p className="relative mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-ink-500">
          <Lock size={12} />
          {lockedNote}
        </p>
      )}
    </>
  )

  if (live && to) {
    return (
      <Link to={to} className="card lift group flex flex-col p-5">
        {body}
      </Link>
    )
  }

  return (
    <div aria-disabled="true" className="card relative flex flex-col overflow-hidden p-5">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-100/90 to-transparent"
      />
      {body}
    </div>
  )
}

function CommunityHub() {
  return (
    <AppShell>
      <PageHeader
        title="Community"
        subtitle="Learn alongside people who've done it — mentors and offline institutions today, internships soon."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <HubTile
          icon={GraduationCap}
          live
          title="Mentors"
          description="Talk to experienced marketers, get feedback on your work, and unblock your next step."
          to="/community/mentors"
          ctaLabel="Meet the mentors"
        />
        <HubTile
          icon={Building2}
          live
          title="Institutions"
          description="INTERVAL, our exclusive offline partner, runs in-person digital marketing training built on your MySkills progress."
          to="/community/institutions"
          ctaLabel="Explore institutions"
        />
        <HubTile
          icon={Briefcase}
          live={false}
          title="Internships"
          description="Real internships with partner companies, so your practice turns into work experience you can actually show."
          lockedNote="We're building this — check back soon."
        />
      </div>

      <div className="mt-6">
        <IntervalPromoCard />
      </div>
    </AppShell>
  )
}
