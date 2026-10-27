import { useState } from 'react'
import { isPhone } from '@/lib/device'
import { Link } from '@tanstack/react-router'
import { Menu, Sparkles, X } from 'lucide-react'
import { GUIDE_ON, setSiteMode } from '@/lib/siteMode'
import { useAuthUser } from '@/lib/useAuth'

/*
 * The site's navbar, as in Paul's platform picture (27 Oct 2026): the
 * wordmark with "The Student Development Platform", the platform's parts
 * (Learning, Mentors, Study Abroad, Internships, Community), Log in and Get
 * Started. Learning and Community are open to visitors; Mentors, Study
 * Abroad and Internships are inside the platform, so a visitor gets a glimpse
 * of each first (components/landing/Glimpse.tsx) and a student goes straight in.
 */
type To = '/' | '/courses' | '/community' | '/study-abroad' | '/mentors' | '/internships'
interface NavLink {
  label: string
  /** Where it goes: the same for everyone, or a visitor's way in via sign-in. */
  to: To
  search?: Record<string, unknown>
  visitor?: { to: To; search?: Record<string, unknown> }
  exact?: boolean
}

const navLinks: NavLink[] = [
  { label: 'Home', to: '/', exact: true },
  { label: 'Learning', to: '/courses' },
  { label: 'Mentors', to: '/community', search: { category: 'mentors' }, visitor: { to: '/mentors' } },
  { label: 'Study Abroad', to: '/study-abroad' },
  { label: 'Internships', to: '/community', search: { category: 'internships' }, visitor: { to: '/internships' } },
  { label: 'Community', to: '/community', exact: true },
]

/** The light navbar, and the dark one for the dark pages (home, courses), in
 *  their translucent navy glass. */
const THEMES = {
  light: {
    header: 'sticky top-0 z-50 border-b border-ink-100 bg-white/90 backdrop-blur',
    my: 'text-ink-900',
    skills: 'from-brand-500 to-brand-700',
    tagline: 'text-ink-500',
    link: 'relative py-1 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900',
    active: 'text-ink-900 after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-brand-600',
    pill: 'inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100',
    logIn: 'press inline-flex h-10 items-center rounded-xl border border-ink-200 px-4 text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-50',
    toggle: 'flex items-center justify-center rounded-md p-2 text-ink-700 lg:hidden',
    mobile: 'border-t border-ink-100 px-4 pb-4 lg:hidden',
    mlink: 'rounded-md px-2 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50',
    mLogIn: 'w-full press inline-flex h-11 items-center justify-center rounded-xl border border-ink-300 px-4 text-center text-sm font-semibold text-ink-900',
  },
  dark: {
    header: 'sticky top-0 z-50 border-b border-white/10 bg-[#040a1e]/70 backdrop-blur-xl',
    my: 'text-white',
    skills: 'from-brand-300 to-fuchsia-300',
    tagline: 'text-white/60',
    link: 'relative py-1 text-sm font-medium text-white/65 transition-colors hover:text-white',
    active: 'text-white after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-brand-300',
    pill: 'inline-flex items-center gap-1.5 rounded-full border border-brand-300/30 bg-white/[0.06] px-3 py-1.5 text-sm font-semibold text-brand-100 backdrop-blur transition-colors hover:bg-white/10',
    logIn: 'press inline-flex h-10 items-center rounded-xl border border-white/25 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10',
    toggle: 'flex items-center justify-center rounded-md p-2 text-white/80 lg:hidden',
    mobile: 'border-t border-white/10 px-4 pb-4 lg:hidden',
    mlink: 'rounded-md px-2 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10',
    mLogIn: 'w-full press inline-flex h-11 items-center justify-center rounded-xl border border-white/25 px-4 text-center text-sm font-semibold text-white',
  },
}

const getStarted =
  'press inline-flex h-10 items-center rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(108,92,231,0.8)] transition-opacity hover:opacity-90'

export function Navbar({ dark = false }: { dark?: boolean } = {}) {
  const t = THEMES[dark ? 'dark' : 'light']
  const [open, setOpen] = useState(false)
  const { user, loading } = useAuthUser()
  const target = (l: NavLink) => (!user && l.visitor ? l.visitor : { to: l.to, search: l.search })

  return (
    <header className={t.header}>
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex flex-col leading-none" aria-label="MySkills, home">
          <span className="font-display text-2xl font-extrabold tracking-tight">
            <span className={t.my}>My</span>
            <span className={`bg-gradient-to-r bg-clip-text text-transparent ${t.skills}`}>Skills</span>
          </span>
          <span className={`mt-1 text-[11px] font-medium ${t.tagline}`}>The Student Development Platform</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => {
            const to = target(link)
            return (
              <Link
                key={link.label}
                to={to.to}
                search={to.search as never}
                activeOptions={{ exact: link.exact, includeSearch: true }}
                className={t.link}
                activeProps={{ className: t.active }}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {/* Wait for the session check to avoid a Log in -> profile flash */}
          {!loading &&
            (user ? (
              <Link to={isPhone() ? '/dashboard' : '/profile'} className={getStarted}>
                {isPhone() ? 'Open LaunchPad' : 'Go to profile'}
              </Link>
            ) : (
              <>
                {/* Back to the AI guide, the computer's other way in (lib/siteMode.ts). */}
                {GUIDE_ON && !isPhone() && (
                  <Link to="/start" onClick={() => setSiteMode('ai')} className={t.pill}>
                    <Sparkles size={14} />
                    Try the AI guide
                  </Link>
                )}
                <Link to="/login" className={t.logIn}>
                  Log in
                </Link>
                <Link to="/signup" className={getStarted}>
                  Get Started
                </Link>
              </>
            ))}
        </div>

        {/* Mobile toggle */}
        <button className={t.toggle} onClick={() => setOpen((v) => !v)} aria-label="Toggle menu" aria-expanded={open}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className={t.mobile}>
          <nav className="flex flex-col gap-1 pt-2">
            {navLinks.map((link) => {
              const to = target(link)
              return (
                <Link key={link.label} to={to.to} search={to.search as never} onClick={() => setOpen(false)} className={t.mlink}>
                  {link.label}
                </Link>
              )
            })}
            <Link to="/community-portal/signup" onClick={() => setOpen(false)} className={t.mlink}>
              Partner with us
            </Link>
            <Link to="/blog" onClick={() => setOpen(false)} className={t.mlink}>
              Blog
            </Link>
          </nav>
          <div className="mt-3 flex flex-col gap-2">
            {!loading &&
              (user ? (
                <Link
                  to={isPhone() ? '/dashboard' : '/profile'}
                  onClick={() => setOpen(false)}
                  className="w-full press inline-flex h-11 items-center justify-center rounded-xl bg-brand-600 px-4 text-center text-sm font-semibold text-white"
                >
                  {isPhone() ? 'Open LaunchPad' : 'Go to profile'}
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className={t.mLogIn}>
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setOpen(false)}
                    className="w-full press inline-flex h-11 items-center justify-center rounded-xl bg-brand-600 px-4 text-center text-sm font-semibold text-white"
                  >
                    Get Started
                  </Link>
                </>
              ))}
          </div>
        </div>
      )}
    </header>
  )
}
