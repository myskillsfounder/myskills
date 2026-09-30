import { createContext, useContext } from 'react'
import type { MentorSideMatch } from '@/lib/mentorMatches'
import type { MyMentorProfile } from '@/lib/mentorPortal'

/** What every page of the mentor portal shares: the mentor's profile and the
 *  requests and students waiting on them, loaded once by the layout. */
export interface MentorPortalState {
  profile: MyMentorProfile
  rows: MentorSideMatch[]
  reload: () => Promise<void>
}

export const MentorPortalContext = createContext<MentorPortalState | null>(null)

export function useMentorPortal(): MentorPortalState {
  const ctx = useContext(MentorPortalContext)
  if (!ctx) throw new Error('useMentorPortal must be used inside the mentor portal layout')
  return ctx
}
