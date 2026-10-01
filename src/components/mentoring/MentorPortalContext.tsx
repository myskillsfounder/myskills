import { createContext, useContext } from 'react'
import type { MentorSideMatch } from '@/lib/mentorMatches'
import type { MyMentorProfile } from '@/lib/mentorPortal'
import type { CommunityAccess } from '@/lib/communityPortal'

/** What the mentor pages of the portal share: the mentor's profile and the
 *  requests and students waiting on them, loaded once by the layout. Only
 *  provided to an account that is a linked mentor. */
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

/** The mentor state, or null for an account that isn't a mentor (a counsellor,
 *  a company…), so a mentor page can step aside instead of throwing. */
export function useMentorPortalOptional(): MentorPortalState | null {
  return useContext(MentorPortalContext)
}

/** Which resources this account may use. Provided to every portal page. */
export const PortalAccessContext = createContext<CommunityAccess[]>([])

export function usePortalAccess(): CommunityAccess[] {
  return useContext(PortalAccessContext)
}
