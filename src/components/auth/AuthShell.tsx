import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { BarChart3, Check } from 'lucide-react'

interface AuthShellProps {
  title: string
  subtitle: ReactNode
  children: ReactNode
  /** Rendered under the card, e.g. the "Don't have an account?" switch link. */
  footer: ReactNode
}

const PROOF = [
  'Benchmark your marketing skills in 10 minutes',
  'Practice with real business scenarios',
  'Earn a shareable certificate',
]

/**
 * Two-pane auth layout: the form stays the focus on every screen size, with a
 * brand panel on large screens that says what the product actually does.
 */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel — desktop only, never competes with the form */}
      <aside className="surface-wood-dark relative hidden w-[44%] flex-col justify-between p-10 lg:flex xl:p-14">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
            <BarChart3 size={18} />
          </span>
          <span className="font-display text-lg font-semibold text-white">MySkills</span>
        </Link>

        <div>
          <h2 className="font-display text-[2.5rem] font-semibold leading-[1.1] text-white">
            Prove what you
            <br />
            can actually do.
          </h2>
          <ul className="mt-8 space-y-3.5">
            {PROOF.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[15px] text-white/75">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/30 text-brand-100">
                  <Check size={12} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/40">Self-learning platform for digital marketers</p>
      </aside>

      {/* Form pane */}
      <main className="surface-paper flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-[400px]">
          <Link to="/" className="mb-8 flex items-center justify-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900 text-white">
              <BarChart3 size={18} />
            </span>
            <span className="font-display text-lg font-semibold text-ink-900">MySkills</span>
          </Link>

          <div className="rise-in">
            <h1 className="font-display text-3xl font-semibold leading-tight text-ink-900">{title}</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-600">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </div>

          <div className="mt-8 text-center text-sm text-ink-600">{footer}</div>
        </div>
      </main>
    </div>
  )
}
