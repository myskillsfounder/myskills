/**
 * On a phone, MySkills is the Community marketplace and nothing else.
 *
 * The full app (LaunchPad, Practice, the programmes, the profile) is for a
 * computer. A phone gets the one thing people do on the move: find a mentor,
 * a counsellor or guide, an internship or an institution. The two aptitude
 * assessments come along because asking a mentor needs one. A new account is
 * welcomed with the same onboarding as on a computer, then lands in the
 * marketplace; after that, sign-in goes straight there.
 *
 * "A phone" is the device, not the window: a narrow browser window on a
 * computer is still a computer, a tablet keeps the full app, and turning a
 * phone sideways doesn't unlock anything.
 */

let cached: boolean | undefined

export function isPhone(): boolean {
  if (cached !== undefined) return cached
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false
  const ua = navigator.userAgent
  // Phones say so; tablets don't ("Android" without "Mobile", "iPad").
  const saysPhone = /Android.+Mobile|iPhone|iPod|Windows Phone/i.test(ua)
  // A touch-first device whose shorter side is phone-sized, for the ones that don't.
  const smallTouch =
    window.matchMedia?.('(pointer: coarse)').matches === true && Math.min(window.screen.width, window.screen.height) < 600
  cached = saysPhone || smallTouch
  return cached
}

/** What a phone may open inside the app. Everything else in the student app sends them to the marketplace. */
const PHONE_APP = ['/community', '/wellness', '/aptitude-assessment', '/career-readiness-assessment']

export const inPhoneApp = (pathname: string) => PHONE_APP.some((p) => pathname === p || pathname.startsWith(`${p}/`))

/** Where a signed-in student belongs: the marketplace on a phone, the LaunchPad on a computer. */
export const homePath = (): '/community' | '/dashboard' => (isPhone() ? '/community' : '/dashboard')
