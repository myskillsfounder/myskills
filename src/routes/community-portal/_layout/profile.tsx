import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useAuthUser } from '@/lib/useAuth'
import { fetchMyPortalRequest, type MyPortalRequest } from '@/lib/portalAccess'
import { PageHeader } from '@/components/ui'
import { useMentorPortalOptional, usePortalAccess } from '@/components/mentoring/MentorPortalContext'
import { MentorProfilePanel } from '@/components/mentoring/MentorProfilePanel'
import { PartnerPresence } from '@/components/mentoring/PartnerPresence'
import { VerificationCard } from '@/components/mentoring/VerificationCard'

export const Route = createFileRoute('/community-portal/_layout/profile')({
  component: ProfilePage,
})

/**
 * Every verified partner's own page: where their verification stands, and how
 * they appear to students. A mentor shapes their listing here; the others are
 * shown what (if anything) students see of them.
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
            : 'Your verification, and how you show up to students.'
        }
      />
      <div className="space-y-6">
        <VerificationCard email={user?.email} mentor={mentor?.profile ?? null} access={access} request={request} />
        {mentor && <MentorProfilePanel profile={mentor.profile} onSaved={() => void mentor.reload()} />}
        {access.length > 0 && <PartnerPresence access={access} />}
      </div>
    </>
  )
}
