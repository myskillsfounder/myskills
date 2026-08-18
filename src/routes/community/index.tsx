import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, GraduationCap } from 'lucide-react'
import { AppShell } from '@/components/app/AppShell'

export const Route = createFileRoute('/community/')({
  component: CommunityHome,
})

function CommunityHome() {
  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">Community</h1>
        <p className="mt-1 text-sm text-ink-600">Connect with other marketing learners.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/community/mentors"
          className="group flex items-start gap-4 card p-5 transition-colors hover:border-brand-300"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <GraduationCap size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink-900">Mentors</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-600">
              Connect with experienced marketing mentors.
            </p>
          </div>
          <ArrowRight
            size={18}
            className="mt-1 shrink-0 text-ink-400 transition-colors group-hover:text-brand-600"
          />
        </Link>
      </div>
    </AppShell>
  )
}
