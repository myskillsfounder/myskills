import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { useAuthUser } from '@/lib/useAuth'

const navLinks = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Skill tracks', href: '#skill-tracks' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, loading } = useAuthUser()

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-lg font-semibold tracking-tight text-ink-900">
          MySkills
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
            >
              {link.label}
            </a>
          ))}
          <Link
            to="/blog"
            className="text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
          >
            Blog
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {/* Wait for the session check to avoid a Sign In -> profile flash */}
          {!loading &&
            (user ? (
              <Link
                to="/profile"
                className="press inline-flex h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-brand-700"
              >
                Go to profile
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-ink-700 transition-colors hover:text-ink-900"
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
          className="flex items-center justify-center rounded-md p-2 text-ink-700 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-ink-100 px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/blog"
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
            >
              Blog
            </Link>
          </nav>
          <div className="mt-3 flex flex-col gap-2">
            {!loading &&
              (user ? (
                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="w-full press inline-flex h-11 items-center justify-center rounded-xl bg-brand-600 px-4 text-center text-sm font-semibold text-white"
                >
                  Go to profile
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="w-full press inline-flex h-11 items-center justify-center rounded-xl border border-ink-300 px-4 text-center text-sm font-semibold text-ink-900"
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
