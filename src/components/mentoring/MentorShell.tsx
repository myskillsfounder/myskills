import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { Link, useRouter, useRouterState } from '@tanstack/react-router'
import { ChevronRight, Eye, LogOut, Menu, ShieldCheck, X } from 'lucide-react'
import { signOut } from '@/lib/auth'
import { Avatar } from '@/components/ui'
import { useDarkTheme } from '@/components/app/AppShell'

/** One section of the portal the signed-in account may open. */
export interface PortalTab {
  to: string
  label: string
  icon: ComponentType<{ size?: number }>
  /** Something is waiting (student requests). */
  count?: number
  /** Needs attention (an unfinished profile). */
  dot?: boolean
  /** Match this address exactly rather than everything under it. */
  exact?: boolean
  /** Starts a new group in the sidebar, under this heading. */
  group?: string
}

/**
 * The Community portal's own frame: a sidebar down the left on a computer, a
 * slide-in menu on a phone. Deliberately shares nothing with the student app —
 * no LaunchPad, Practice or Community — so a mentor, counsellor or partner
 * sees a workspace built for them, the way /admin is for staff.
 *
 * The MySkills team can open it too, to see every partner's students. That is
 * a different thing from a partner's own portal, so it is marked as one: a
 * gold "Team overview" label and a bar across the top saying it is read-only.
 */
export function MentorShell({
  children,
  name,
  photo,
  subtitle,
  tabs: tabList,
  overview = false,
  adminLink = false,
  profile,
}: {
  children: ReactNode
  /** The signed-in person, once known. */
  name?: string
  photo?: string | null
  /** Under the name: their role or organisation. */
  subtitle?: string
  /** The sections this account may open: only the resources it was given. */
  tabs: PortalTab[]
  /** A MySkills team account looking across every partner (read-only). */
  overview?: boolean
  /** This account can also open the admin panel: offer the way across. */
  adminLink?: boolean
  /** The account's own profile page. The name at the foot of the menu opens it,
   *  so the person and their profile are one place, not two. */
  profile?: { to: string; dot: boolean }
}) {
  // Dark like the student app (components/app/AppShell).
  useDarkTheme()
  const router = useRouter()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [open, setOpen] = useState(false)

  // A tap on a menu item (or the browser's back button) closes the phone menu.
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

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

  const nav = (
    <nav aria-label="Community portal" className="flex-1 overflow-y-auto px-3 py-4">
      {tabs.map((t, i) => (
        <div key={t.to}>
          {t.group && (
            <p className={`px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400 ${i > 0 ? 'mt-5' : ''}`}>
              {t.group}
            </p>
          )}
          <Link
            to={t.to}
            aria-current={t.active ? 'page' : undefined}
            className={`mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
              t.active ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
            }`}
          >
            <t.icon size={17} />
            <span className="min-w-0 flex-1 truncate">{t.label}</span>
            {t.count > 0 && (
              <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
                {t.count}
              </span>
            )}
            {t.dot && <span aria-label="needs attention" className="h-2 w-2 rounded-full bg-amber-500" />}
          </Link>
        </div>
      ))}
    </nav>
  )

  const who = name && (
    <>
      <span className="relative shrink-0">
        <Avatar name={name} src={photo ?? undefined} size={36} />
        {profile?.dot && (
          <span
            aria-label="Your profile needs finishing"
            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white"
          />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink-900">{name}</span>
        {subtitle && (
          <span className="block truncate text-xs text-ink-500" title={subtitle}>
            {subtitle}
          </span>
        )}
        {profile && (
          <span className={`block text-xs font-semibold ${profile.dot ? 'text-amber-700' : 'text-brand-700'}`}>
            {profile.dot ? 'Finish your profile' : 'View your profile'}
          </span>
        )}
      </span>
    </>
  )
  const onProfile = profile ? here === profile.to || here.startsWith(`${profile.to}/`) : false

  const account = (
    <div className="border-t border-ink-900/[0.06] p-3">
      {who &&
        (profile ? (
          <Link
            to={profile.to}
            aria-current={onProfile ? 'page' : undefined}
            className={`group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors ${
              onProfile ? 'bg-brand-50' : 'hover:bg-ink-100'
            }`}
          >
            {who}
            <ChevronRight size={16} className="shrink-0 text-ink-400 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <div className="flex items-center gap-3 px-2 py-2">{who}</div>
        ))}
      {adminLink && (
        <Link
          to="/admin"
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
        >
          <ShieldCheck size={17} /> MySkills Admin
        </Link>
      )}
      <button
        type="button"
        onClick={() => void handleSignOut()}
        className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
      >
        <LogOut size={17} /> Sign out
      </button>
    </div>
  )

  const brand = (
    <Link to="/community-portal" className="flex items-center gap-2.5 px-5">
      <span className="min-w-0">
        <span className="block font-display text-lg font-semibold leading-tight tracking-tight text-ink-900">MySkills</span>
        <span className={`block text-[11px] font-semibold uppercase tracking-[0.14em] ${overview ? 'text-gold-600' : 'text-brand-700'}`}>
          {overview ? 'Team overview' : 'Community Portal'}
        </span>
      </span>
    </Link>
  )

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Computer: a fixed sidebar. */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-ink-900/[0.06] bg-white lg:flex">
        <div className="flex h-16 items-center">{brand}</div>
        {nav}
        {account}
      </aside>

      {/* Phone: a bar with a menu button. */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ink-900/[0.06] bg-white/90 px-4 backdrop-blur lg:hidden">
        <Link to="/community-portal" className="flex items-center gap-2">
          <span className="font-display text-base font-semibold text-ink-900">MySkills</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              overview ? 'bg-gold-50 text-gold-700' : 'bg-brand-50 text-brand-700'
            }`}
          >
            {overview ? 'Team overview' : 'Community Portal'}
          </span>
        </Link>
        <div className="flex items-center gap-1">
          {/* The person, one tap from their profile, as on the computer's menu. */}
          {profile && name && (
            <Link to={profile.to} aria-label="Your profile" className="relative flex h-10 w-10 items-center justify-center rounded-full">
              <Avatar name={name} src={photo ?? undefined} size={30} />
              {profile.dot && (
                <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
              )}
            </Link>
          )}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-700 hover:bg-ink-100"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink-900/40"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-white shadow-e2">
            <div className="flex h-14 items-center justify-between pr-3">
              {brand}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100"
              >
                <X size={18} />
              </button>
            </div>
            {nav}
            {account}
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        {overview && (
          <div className="flex items-center gap-2.5 border-b border-gold-200 bg-gold-50 px-4 py-2.5 text-sm text-gold-700 sm:px-6 lg:px-10">
            <Eye size={15} className="shrink-0" />
            <p className="min-w-0">
              <span className="font-semibold">Team overview.</span> You’re seeing every partner’s students, read-only.
              Partners only ever see their own.
            </p>
          </div>
        )}
        <div className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-10 lg:pt-10">{children}</div>
      </main>
    </div>
  )
}
