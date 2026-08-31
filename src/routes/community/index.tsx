import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Building2, GraduationCap, Lock } from 'lucide-react'
import { AppShell } from '@/components/app/AppShell'
import { Badge, PageHeader } from '@/components/ui'

export const Route = createFileRoute('/community/')({
  component: CommunityHome,
})

function CommunityHome() {
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
            We’re building this — check back soon.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
