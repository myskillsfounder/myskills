import { Link } from '@tanstack/react-router'
import { ArrowRight, BadgeCheck, MailCheck, ShieldCheck, UserPlus } from 'lucide-react'
import type { PortalRole } from '@/lib/portalAccess'
import type { PartnerPage } from './PartnerLanding'

const STEP_ICONS = [UserPlus, MailCheck, ShieldCheck, BadgeCheck]

/**
 * The foot of every partner page: the steps, and the one way in, the
 * Community portal's sign-up with the role already chosen. There is no
 * application form on these pages (Paul, 25 Oct 2026): every partner starts
 * with an account the team verifies.
 */
export function PartnerSignup({
  page,
  role,
  title,
  body,
  signIn,
}: {
  page: PartnerPage
  role: PortalRole
  title: string
  body: string
  /** "Already a mentor? Sign in", and so on. */
  signIn: string
}) {
  return (
    <div id="apply" className="surface-paper scroll-mt-16 border-t border-ink-900/[0.06]">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="card overflow-hidden">
          <div className="p-6 sm:p-8">
            <h2 className="font-display text-2xl font-semibold leading-tight text-ink-900 sm:text-3xl">{title}</h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-600">{body}</p>

            <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {page.steps.slice(0, 4).map((s, i) => {
                const Icon = STEP_ICONS[i % STEP_ICONS.length]
                return (
                  <li key={s.title} className="rounded-xl bg-ink-50 p-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
                      <Icon size={17} />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-ink-900">
                      {i + 1}. {s.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-600">{s.body}</p>
                  </li>
                )
              })}
            </ol>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
              <Link
                to="/community-portal/signup"
                search={{ role }}
                className="press inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-600 px-7 text-[15px] font-semibold text-white transition-colors hover:bg-brand-700"
              >
                {page.cta}
                <ArrowRight size={17} />
              </Link>
              <Link to="/community-portal/login" className="text-center text-sm font-semibold text-brand-700 hover:underline">
                {signIn}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
