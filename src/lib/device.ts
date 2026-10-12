/**
 * On a phone, MySkills is three things: the Community marketplace, the
 * LaunchPad and Practice, each laid out for a phone.
 *
 * The Community is where a phone signs in to. The LaunchPad and Practice are
 * trimmed to what is done on a phone (where you stand, and the next thing to
 * practise); in the bottom bar they come first, then the Community. The
 * profile is on a phone too, reached from the top bar: it is where a student's
 * own details are kept, and those are what a mentor or a company sees. The
 * rest of the app (reviews, the support chat and the like) stays on a computer. A phone also has its own
 * front door and its own short onboarding (routes/welcome.tsx).
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
  // A search engine reading the site as a phone would is not a person on a
  // phone: it gets the same pages as everyone, so what is indexed is the site.
  if (/bot|crawl|spider|slurp|bingpreview|lighthouse|headless/i.test(ua)) return (cached = false)
  // Phones say so; tablets don't ("Android" without "Mobile", "iPad").
  const saysPhone = /Android.+Mobile|iPhone|iPod|Windows Phone/i.test(ua)
  // A touch-first device whose shorter side is phone-sized, for the ones that don't.
  const smallTouch =
    window.matchMedia?.('(pointer: coarse)').matches === true && Math.min(window.screen.width, window.screen.height) < 600
  cached = saysPhone || smallTouch
  return cached
}

/** What a phone may open inside the app: the Community, the LaunchPad,
 *  Practice with everything practising leads to, and the student's own
 *  profile. Anything else in the student app sends them to the Community. */
const PHONE_APP = [
  '/community',
  '/wellness',
  '/dashboard',
  '/practice',
  '/career-module',
  '/aptitude-assessment',
  '/career-readiness-assessment',
  '/foundation-assessment',
  '/certificate',
  '/profile',
]

export const inPhoneApp = (pathname: string) => PHONE_APP.some((p) => pathname === p || pathname.startsWith(`${p}/`))

/** Where a signed-in student lands: the Community on a phone, the LaunchPad on a computer. */
export const homePath = (): '/community' | '/dashboard' => (isPhone() ? '/community' : '/dashboard')
