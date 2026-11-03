/**
 * On a phone, MySkills is Study rooms, Practice, the Community marketplace and
 * the profile, each laid out for a phone.
 *
 * Study rooms is where a student signs in to, on a phone as on a computer
 * (Paul, 3 Nov 2026). The profile, the last tab of the bottom bar, holds what
 * was the LaunchPad (where they stand, and what's next) and the student's own
 * details, which are what a mentor or a company sees. The rest of the app
 * (reviews and the like) stays on a computer. A phone also has its own front
 * door (routes/welcome.tsx).
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

/** What a phone may open inside the app: Study rooms, the Community,
 *  Practice with everything practising leads to, and the student's own
 *  profile. Anything else in the student app sends them home. */
const PHONE_APP = [
  '/study-rooms',
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
  // A course-engine programme (Entrepreneurship): its test, modules and final.
  '/programmes',
]

export const inPhoneApp = (pathname: string) => PHONE_APP.some((p) => pathname === p || pathname.startsWith(`${p}/`))

/** Where a signed-in student lands: Study rooms, on a phone too (Paul, 3 Nov
 *  2026: "students come together and study online"). */
export const homePath = (): '/study-rooms' => '/study-rooms'
