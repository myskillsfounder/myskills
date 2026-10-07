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
export const signinLink = () => `${window.location.origin}/community-portal/login`

/**
 * The way in, to copy or to email. For someone with no account: the partner
 * sign-up with their role already chosen. For someone who already has a
 * MySkills account (`existing`): the portal sign-in, where they are asked what
 * they do. Either way they then wait to be verified like everyone else. Only
 * the role is ever in the link; the person types their own email.
 */
export function InviteLink({ role, email, existing = false }: { role?: PortalRole; email?: string; existing?: boolean }) {
  const [copied, setCopied] = useState(false)
  const link = existing || !role ? signinLink() : signupLink(role)
  const body = existing
    ? `Hi,\n\nTo partner with MySkills, sign in to the Community portal with the MySkills account you already have:\n${link}\n\nYou will be asked what you do. We then verify you and your portal opens.\n\nThanks,\nMySkills`
    : `Hi,\n\nPlease create your MySkills partner account here:\n${link}\n\nSign up with this email address and confirm it with the code we send you. We then verify you and your portal opens.\n\nThanks,\nMySkills`
  const mail = `mailto:${email ?? ''}?subject=${encodeURIComponent('Partner with MySkills')}&body=${encodeURIComponent(body)}`

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
