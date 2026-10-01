import type { ComponentType, ReactNode } from 'react'
import { Link, useRouter, useRouterState } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { signOut } from '@/lib/auth'
import { Avatar } from '@/components/ui'

/** One section of the portal the signed-in account may open. */
export interface PortalTab {
  to: string
  label: string
  /** A shorter label for the phone tab row. */
  short: string
  icon: ComponentType<{ size?: number }>
  /** Something is waiting (student requests). */
  count?: number
  /** Needs attention (an unfinished profile). */
  dot?: boolean
  /** Match this address exactly rather than everything under it. */
  exact?: boolean
}

/**
 * The Community portal's own frame. Deliberately shares nothing with the student
 * app — no LaunchPad, Practice or Community, no bottom tab bar — so a mentor
 * sees a workspace built for them, the way /admin is for staff.
 */
export function MentorShell({
  children,
  name,
  photo,
  tabs: tabList,
}: {
  children: ReactNode
  /** The signed-in person, once known. */
  name?: string
  photo?: string | null
  /** The sections this account may open: only the resources it was given. */
  tabs: PortalTab[]
}) {
  const router = useRouter()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  async function handleSignOut() {
    await signOut()
    router.navigate({ to: '/community-portal/login' })
  }

  const here = pathname.replace(/\/$/, '')
  const tabs = tabList.map((t) => ({
    ...t,
    count: t.count ?? 0,
    dot: t.dot ?? false,
    active: t.exact ? here === t.to : here === t.to || here.startsWith(`${t.to}/`),
  }))

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-30 border-b border-ink-900/[0.06] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:px-6">
          <Link to="/community-portal" className="flex shrink-0 items-center gap-2">
            <img src="/logo-mark.png" alt="" className="h-8 w-8" />
            <span className="font-display text-lg font-semibold tracking-tight text-ink-900">MySkills</span>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-700">
              Community Portal
            </span>
          </Link>

          <nav aria-label="Community portal" className="ml-4 hidden items-center gap-1 sm:flex">
            {tabs.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                aria-current={t.active ? 'page' : undefined}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  t.active ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
                }`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
                    {t.count}
                  </span>
                )}
                {t.dot && <span aria-label="needs attention" className="h-2 w-2 rounded-full bg-amber-500" />}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {name && (
              <span className="hidden items-center gap-2 text-sm font-medium text-ink-700 md:inline-flex">
                <Avatar name={name} src={photo ?? undefined} size={28} />
                {name}
              </span>
            )}
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign out</span>
              <span className="sr-only sm:hidden">Sign out</span>
            </button>
          </div>
        </div>

        {/* Phones: the sections as tabs under the bar, not a hamburger. */}
        <nav aria-label="Community portal" className="flex overflow-x-auto border-t border-ink-900/[0.06] [scrollbar-width:none] sm:hidden">
          {tabs.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              aria-current={t.active ? 'page' : undefined}
              className={`relative flex h-11 min-w-fit flex-1 items-center justify-center gap-2 whitespace-nowrap px-3 text-sm font-semibold ${
                t.active ? 'text-brand-700' : 'text-ink-600'
              }`}
            >
              <t.icon size={16} />
              {t.short}
              {t.count > 0 && (
                <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
                  {t.count}
                </span>
              )}
              {t.dot && <span aria-label="needs attention" className="h-2 w-2 rounded-full bg-amber-500" />}
              {t.active && <span aria-hidden className="absolute inset-x-6 bottom-0 h-0.5 rounded-full bg-brand-600" />}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">{children}</main>
    </div>
  )
}
