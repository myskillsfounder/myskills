import { useMyMatch } from '@/lib/mentorMatches'
import { YourInternships, useInternships } from '@/components/community/Internships'
import { YourMentors } from '@/components/community/YourMentors'

/**
 * What is waiting on someone else: internship applications and mentor
 * requests. At the top of the profile's "My progress" (Paul, 3 Nov 2026: the
 * Community is search and categories only). Each card hides itself when there
 * is nothing to show.
 */
export function YourActivity() {
  const internships = useInternships()
  const dmMatch = useMyMatch('digital-marketing')
  const crMatch = useMyMatch('career-readiness')
  return (
    <div className="space-y-5 empty:hidden">
      <YourInternships applications={internships.applications} onChanged={() => void internships.reload()} />
      <YourMentors
        matches={[
          { match: dmMatch.match, programme: 1, label: 'Digital Marketing' },
          { match: crMatch.match, programme: 2, label: 'Global Leadership' },
        ]}
      />
    </div>
  )
}
