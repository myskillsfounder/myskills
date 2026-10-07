import { useState } from 'react'
import { Check, Copy, Mail } from 'lucide-react'
import type { CommunityResource } from '@/lib/communityPortal'
import type { PortalRole } from '@/lib/portalAccess'
import { Button } from '@/components/ui'

/** The sign-up role that matches each section of the portal. */
export const SIGNUP_ROLE: Record<CommunityResource, PortalRole> = {
  mentors: 'mentor',
  wellness: 'wellness',
  guidance: 'guidance',
  internships: 'internships',
  institutions: 'institutions',
}

export const signupLink = (role: PortalRole) => `${window.location.origin}/community-portal/signup?role=${role}`

/**
 * The way in for someone with no account yet: the partner sign-up with their
 * role already chosen, to copy or to email. Only the role is in the link; the
 * person types their own email when they sign up.
 */
export function InviteLink({ role, email }: { role: PortalRole; email?: string }) {
  const [copied, setCopied] = useState(false)
  const link = signupLink(role)
  const mail = `mailto:${email ?? ''}?subject=${encodeURIComponent('Your MySkills Community portal account')}&body=${encodeURIComponent(
    `Hi,\n\nPlease create your MySkills partner account here:\n${link}\n\nSign up with this email address and confirm it with the code we send you.\n\nThanks,\nMySkills`,
  )}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* the link is on screen to select by hand */
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded-lg bg-white px-3 py-2 text-xs text-ink-700 ring-1 ring-ink-900/[0.08]">{link}</code>
      <Button size="sm" variant="secondary" icon={copied ? Check : Copy} onClick={() => void copy()}>
        {copied ? 'Copied' : 'Copy link'}
      </Button>
      <a
        href={mail}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-ink-300 bg-white px-3.5 text-[13px] font-semibold text-ink-800 hover:border-ink-400 hover:bg-ink-50"
      >
        <Mail size={14} /> Email it
      </a>
    </div>
  )
}
