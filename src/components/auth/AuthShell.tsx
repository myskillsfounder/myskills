import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

interface AuthShellProps {
  title: string
  subtitle: ReactNode
  children: ReactNode
  /** Rendered under the card, e.g. the “Don’t have an account?” switch link. */
  footer: ReactNode
}

/**
 * Centered, mobile-first auth layout: brand wordmark, a single card, and a
 * footer switch link. Black/white/purple design system.
 */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-ink-50">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6">
        <Link
          to="/"
          className="mb-6 text-lg font-semibold tracking-tight text-ink-900"
        >
          MySkills
        </Link>

        <div className="w-full max-w-sm rounded-2xl border border-ink-100 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-12px_rgba(0,0,0,0.12)] sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">{subtitle}</p>

          <div className="mt-6">{children}</div>
        </div>

        <div className="mt-6 text-center text-sm text-ink-500">{footer}</div>
      </div>
    </div>
  )
}
