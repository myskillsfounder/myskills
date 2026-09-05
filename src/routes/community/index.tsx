import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
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

export const Route = createFileRoute('/community/')({
  component: CommunityIndexRoute,
})

/**
 * /community is dual-purpose: signed-out visitors get this public marketing
 * page (its main job is funneling mentor applicants to /become-a-mentor);
 * onboarded users get the in-app hub below. A brief blank frame while auth
 * resolves beats flashing one layout's chrome and then swapping to the other.
 */
function CommunityIndexRoute() {
  const { user, loading } = useAuthUser()

  if (loading) return <div className="min-h-screen bg-white" />
  return user ? <CommunityHub /> : <PublicCommunityPage />
}

const primaryButton =
  'press inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700'

const secondaryButton =
  'press inline-flex items-center justify-center gap-2 rounded-full border border-ink-200 px-6 py-3 text-sm font-semibold text-ink-900 transition-colors hover:border-ink-300'

function PublicCommunityPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pt-10 pb-14 sm:px-6 sm:pt-16 sm:pb-20 lg:px-8 lg:pt-20">
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
              MySkills connects students with mentors who've built real marketing
              careers — for feedback, direction, and the occasional reality check.
            </p>
          </div>
        </section>

        {/* Become a mentor */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <div className="grid items-center gap-10 rounded-2xl border border-brand-100 bg-brand-50/60 p-8 lg:grid-cols-2 lg:p-12">
            <div>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-e1">
                <GraduationCap size={22} />
              </span>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
                Become a mentor
              </h2>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-600">
                Students across India use MySkills to build real digital
                marketing skills. If you've done the work, a little of your time
                goes a long way — no learner account needed, just a few minutes
                to apply.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link to="/become-a-mentor" className={primaryButton}>
                  Apply to mentor
                  <ArrowRight size={16} />
                </Link>
                <Link to="/community/mentors" className={secondaryButton}>
                  Meet current mentors
                </Link>
              </div>
            </div>

            <ul className="space-y-3.5">
              {[
                'Answer questions and unblock students in live support chat',
                'Get featured on your profile with a verified mentor badge',
                'Shape what a career in digital marketing actually looks like',
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-sm text-ink-700">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brand-600" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Institutions teaser */}
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <div className="flex flex-col items-start gap-4 rounded-2xl border border-ink-100 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink-100 text-ink-500">
                <Building2 size={20} />
              </span>
              <div>
                <p className="font-semibold text-ink-900">Institutions</p>
                <p className="mt-0.5 max-w-sm text-sm text-ink-500">
                  Colleges and training partners running MySkills with their
                  students — cohorts, shared progress, campus leaderboards.
                </p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-ink-200 bg-ink-50 px-3 py-1.5 text-xs font-medium text-ink-500">
              <Lock size={12} />
              Coming soon
            </span>
          </div>
        </section>

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
function CommunityHub() {
  return (
    <AppShell>
      <PageHeader
        title="Community"
        subtitle="Learn alongside people who've done it — mentors today, institutions soon."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Mentors — live */}
        <Link
          to="/community/mentors"
          className="card lift group flex flex-col p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-e1 transition-transform duration-300 group-hover:scale-105">
              <GraduationCap size={22} />
            </span>
            <Badge tone="success">Available</Badge>
          </div>

          <h2 className="mt-4 font-display text-xl font-semibold text-ink-900">Mentors</h2>
          <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-600">
            Talk to experienced marketers, get feedback on your work, and unblock your next step.
          </p>

          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
            Meet the mentors
            <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </Link>

        {/* Institutions — coming soon */}
        <div
          aria-disabled="true"
          className="card relative flex flex-col overflow-hidden p-5"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-100/90 to-transparent"
          />

          <div className="relative flex items-start justify-between gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-brand-600 text-white opacity-70 shadow-e1 grayscale">
              <Building2 size={22} />
            </span>
            <Badge tone="neutral" icon={Lock}>
              Coming soon
            </Badge>
          </div>

          <h2 className="relative mt-4 font-display text-xl font-semibold text-ink-900">Institutions</h2>
          <p className="relative mt-1.5 flex-1 text-sm leading-relaxed text-ink-600">
            Colleges and training partners running MySkills with their students — cohorts, shared
            progress, and campus leaderboards.
          </p>

          <p className="relative mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-ink-500">
            <Lock size={12} />
            We're building this — check back soon.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
