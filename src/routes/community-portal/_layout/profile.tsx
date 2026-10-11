import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useAuthUser } from '@/lib/useAuth'
import { fetchMyPortalRequest, type MyPortalRequest } from '@/lib/portalAccess'
import { PageHeader } from '@/components/ui'
import { useMentorPortalOptional, usePortalAccess } from '@/components/mentoring/MentorPortalContext'
import { MentorProfilePanel } from '@/components/mentoring/MentorProfilePanel'
import { PartnerPresence } from '@/components/mentoring/PartnerPresence'
import { PartnerProfilePanel } from '@/components/mentoring/PartnerProfilePanel'
import { VerificationCard } from '@/components/mentoring/VerificationCard'

export const Route = createFileRoute('/community-portal/_layout/profile')({
  component: ProfilePage,
})

/**
 * Every verified partner's own page: where their verification stands, their
 * profile, and how they appear to students. A mentor's profile is their
 * listing, which students see; every other partner fills in a profile for the
 * MySkills team, and is shown what (if anything) students see of them.
 */
function ProfilePage() {
  const mentor = useMentorPortalOptional()
  const access = usePortalAccess()
  const { user } = useAuthUser()
  const [request, setRequest] = useState<MyPortalRequest | null>(null)

  // Only for the date and the organisation on the card: the page is fine without it.
  useEffect(() => {
    let active = true
    fetchMyPortalRequest().then(
      (r) => active && setRequest(r),
      () => {},
    )
    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <PageHeader
        eyebrow="Community portal"
        title="My profile"
        subtitle={
          mentor
            ? 'Your verification, how students see you, and whether you’re taking new students.'
            : 'Your verification, your profile, and how you show up to students.'
        }
      />
      <div className="space-y-6">
        <VerificationCard email={user?.email} mentor={mentor?.profile ?? null} access={access} request={request} />
        {mentor ? (
          <MentorProfilePanel profile={mentor.profile} onSaved={() => void mentor.reload()} />
        ) : (
          // A partner with a section of their own. (A team account that only looks across isn't one.)
          access.some((a) => !a.sees_all) && <PartnerProfilePanel access={access} />
        )}
        {access.length > 0 && <PartnerPresence access={access} />}
      </div>
    </>
  )
}
