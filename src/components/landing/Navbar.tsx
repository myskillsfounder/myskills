import { useState } from 'react'
import { isPhone } from '@/lib/device'
import { Link } from '@tanstack/react-router'
import { Menu, Sparkles, X } from 'lucide-react'
import { setSiteMode } from '@/lib/siteMode'
import { useAuthUser } from '@/lib/useAuth'

// Home, then every course in one place (/courses, Paul 26 Oct 2026): the
// course pages (Digital Marketing, Global Leadership, Entrepreneurship) are
// reached from there.
const navLinks = [
  { label: 'Home', href: '/', exact: true },
  { label: 'Courses', href: '/courses' },
]

/** The light navbar, and the dark one for the dark pages (home, courses), in
 *  their translucent navy glass. */
const THEMES = {
  light: {
    header: 'sticky top-0 z-50 border-b border-ink-100 bg-white/90 backdrop-blur',
    logo: 'text-lg font-semibold tracking-tight text-ink-900',
    link: 'text-sm font-medium text-ink-500 transition-colors hover:text-ink-900',
    active: 'text-ink-900',
    pill: 'inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100',
    signIn: 'text-sm font-medium text-ink-700 transition-colors hover:text-ink-900',
    toggle: 'flex items-center justify-center rounded-md p-2 text-ink-700 md:hidden',
    mobile: 'border-t border-ink-100 px-4 pb-4 md:hidden',
    mlink: 'rounded-md px-2 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50',
    mSignIn: 'w-full press inline-flex h-11 items-center justify-center rounded-xl border border-ink-300 px-4 text-center text-sm font-semibold text-ink-900',
  },
  dark: {
    header: 'sticky top-0 z-50 border-b border-white/10 bg-[#0b0a1c]/70 backdrop-blur-xl',
    logo: 'text-lg font-semibold tracking-tight text-white',
    link: 'text-sm font-medium text-white/60 transition-colors hover:text-white',
    active: 'text-white',
    pill: 'inline-flex items-center gap-1.5 rounded-full border border-brand-300/30 bg-white/[0.06] px-3 py-1.5 text-sm font-semibold text-brand-100 backdrop-blur transition-colors hover:bg-white/10',
    signIn: 'text-sm font-medium text-white/75 transition-colors hover:text-white',
    toggle: 'flex items-center justify-center rounded-md p-2 text-white/80 md:hidden',
    mobile: 'border-t border-white/10 px-4 pb-4 md:hidden',
    mlink: 'rounded-md px-2 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10',
    mSignIn: 'w-full press inline-flex h-11 items-center justify-center rounded-xl border border-white/25 px-4 text-center text-sm font-semibold text-white',
  },
}

export function Navbar({ dark = false }: { dark?: boolean } = {}) {
  const t = THEMES[dark ? 'dark' : 'light']
  const [open, setOpen] = useState(false)
  const { user, loading } = useAuthUser()

  return (
    <header className={t.header}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className={t.logo}>
          MySkills
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              activeOptions={{ exact: link.exact }}
              className={t.link}
              activeProps={{ className: t.active }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/community"
            search={{ partners: true }}
            className={t.link}
          >
            Partner with us
          </Link>
          <Link
            to="/blog"
            className={t.link}
          >
            Blog
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {/* Wait for the session check to avoid a Sign In -> profile flash */}
          {!loading &&
            (user ? (
              <Link
                to={isPhone() ? '/dashboard' : '/profile'}
                className="press inline-flex h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-brand-700"
              >
                {isPhone() ? 'Open LaunchPad' : 'Go to profile'}
              </Link>
            ) : (
              <>
                {/* Back to the AI guide, the computer's other way in (lib/siteMode.ts). */}
                {!isPhone() && (
                  <Link
                    to="/start"
                    onClick={() => setSiteMode('ai')}
                    className={t.pill}
                  >
                    <Sparkles size={14} />
                    Try the AI guide
                  </Link>
                )}
                <Link
                  to="/login"
                  className={t.signIn}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="press inline-flex h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-brand-700"
                >
                  Sign Up
                </Link>
              </>
            ))}
        </div>

        {/* Mobile toggle */}
        <button
          className={t.toggle}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className={t.mobile}>
          <nav className="flex flex-col gap-1 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setOpen(false)}
                className={t.mlink}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/community"
            search={{ partners: true }}
              onClick={() => setOpen(false)}
              className={t.mlink}
            >
              Partner with us
            </Link>
            <Link
              to="/blog"
              onClick={() => setOpen(false)}
              className={t.mlink}
            >
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
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className={t.mSignIn}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setOpen(false)}
                    className="w-full press inline-flex h-11 items-center justify-center rounded-xl bg-brand-600 px-4 text-center text-sm font-semibold text-white"
                  >
                    Sign Up
                  </Link>
                </>
              ))}
          </div>
        </div>
      )}
    </header>
  )
}
