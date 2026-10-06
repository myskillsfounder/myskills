import { Link } from '@tanstack/react-router'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import type { PortalRole } from '@/lib/portalAccess'

/**
 * Shown once an application is in. The application is the detail; the portal
 * account is how they sign in, and it is what the team verifies. Sending them
 * straight on means nobody is approved and then left with nothing to open.
 *
 * Only the role goes in the link: the email they applied with is typed again at
 * sign-up (never passed in the address), and the team matches the two by it.
 */
export function NextStepAccount({ role, back }: { role: PortalRole; back: { to: string; label: string } }) {
  return (
    <div className="mx-auto mt-7 max-w-md rounded-2xl bg-brand-50 p-5 text-left">
      <p className="flex items-center gap-2 text-sm font-semibold text-brand-900">
        <ShieldCheck size={16} />
        Next: create your partner account
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-brand-900/80">
        It’s how you’ll sign in to the Community portal. Use the same email address and the team will match it to this
        application when they verify you.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Link
          to="/community-portal/signup"
          search={{ role }}
          className="press inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Partner with MySkills
          <ArrowRight size={16} />
        </Link>
        <Link to={back.to} className="px-3 py-2 text-center text-sm font-semibold text-brand-800 hover:underline">
          {back.label}
        </Link>
      </div>
    </div>
  )
}
