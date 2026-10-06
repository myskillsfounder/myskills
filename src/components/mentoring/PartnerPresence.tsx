import { useEffect, useState } from 'react'
import { Briefcase, Building2, Compass, EyeOff, HeartHandshake, LayoutDashboard, type LucideIcon } from 'lucide-react'
import type { CommunityAccess, CommunityResource } from '@/lib/communityPortal'
import { fetchInstitutionPartners, type InstitutionPartner } from '@/lib/institutionPartners'
import { InstitutionListingCard } from '@/components/community/Marketplace'

const ICON: Record<CommunityResource, LucideIcon> = {
  mentors: LayoutDashboard,
  wellness: HeartHandshake,
  guidance: Compass,
  internships: Briefcase,
  institutions: Building2,
}

/** How each kind of partner appears to students, in plain words. Only mentors
 *  and institutions have a public listing; saying so is better than leaving a
 *  counsellor to wonder where their profile is. */
const PRESENCE: Record<Exclude<CommunityResource, 'mentors' | 'institutions'>, { title: string; body: string }> = {
  wellness: {
    title: 'Counsellors aren’t listed publicly',
    body: 'Students don’t browse counsellors. They send a private request, the MySkills team reads it and introduces you. Nothing about you is shown in the app, so there is no public profile to set up.',
  },
  guidance: {
    title: 'Career guides aren’t listed publicly',
    body: 'Students ask for career guidance with a private request, and the MySkills team introduces you. Nothing about you is shown in the app, so there is no public profile to set up.',
  },
  internships: {
    title: 'Companies aren’t listed publicly',
    body: 'Students see the kinds of internship roles on offer, not a directory of companies. Your company is shared with a student only when the team places them with you.',
  },
}

function Note({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-600">
        <Icon size={17} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink-900">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-ink-600">{body}</p>
      </div>
    </div>
  )
}

/**
 * For a partner who isn't a mentor: how they show up in the student app. An
 * institution sees its real listing (the team manages it); everyone else is
 * told, truthfully, that students never see them in a list.
 */
export function PartnerPresence({ access }: { access: CommunityAccess[] }) {
  const institution = access.find((a) => a.resource === 'institutions' && !a.sees_all)
  const [listing, setListing] = useState<InstitutionPartner | null>()

  useEffect(() => {
    if (!institution?.organisation) return
    let active = true
    const wanted = institution.organisation.trim().toLowerCase()
    fetchInstitutionPartners().then(
      (list) => active && setListing(list.find((p) => p.legal_name.trim().toLowerCase() === wanted) ?? null),
      () => active && setListing(null),
    )
    return () => {
      active = false
    }
  }, [institution?.organisation])

  const own = access.filter((a) => !a.sees_all)
  const overview = access.filter((a) => a.sees_all)

  return (
    <section className="card p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold text-ink-900">How you show up in the app</h2>
      <p className="mt-0.5 text-sm text-ink-600">What students can see of you, and where.</p>

      <div className="mt-5 space-y-5">
        {own.map((a) => {
          if (a.resource === 'institutions') {
            return (
              <div key={a.resource}>
                <Note
                  icon={ICON.institutions}
                  title={listing ? 'Your listing in Community' : 'Your listing isn’t live yet'}
                  body={
                    listing
                      ? 'This is the card students see under Institutions. The MySkills team manages it: tell us if your courses, city, logo or rating need updating.'
                      : 'Students find institutions under Community. The MySkills team sets up your listing from your application: your courses, city, logo and Google rating. Ask us if you’d like to check on it.'
                  }
                />
                {listing && (
                  // The real card, but not a link out of the portal.
                  <div className="pointer-events-none mt-4 max-w-sm" aria-hidden>
                    <InstitutionListingCard partner={listing} />
                  </div>
                )}
              </div>
            )
          }
          if (a.resource === 'mentors') return null
          return <Note key={a.resource} icon={ICON[a.resource]} {...PRESENCE[a.resource]} />
        })}
        {overview.length > 0 && (
          <Note
            icon={EyeOff}
            title="Overview access isn’t visible to students"
            body="You can see every student in the sections you were given, read-only. Students don’t see this account anywhere."
          />
        )}
      </div>
    </section>
  )
}
