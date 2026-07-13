import { useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import { Link, useRouter, useRouterState } from '@tanstack/react-router'
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  Dumbbell,
  FileText,
  Gamepad2,
  LayoutGrid,
  LogOut,
  Menu,
  MessageCircle,
  User,
  X,
} from 'lucide-react'
import { signOut } from '@/lib/auth'
import { useAssessmentDone } from '@/lib/assessmentResults'

type IconType = ComponentType<{ size?: number; className?: string }>

const NAV: { to: string; label: string; icon: IconType }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/practice', label: 'Practice', icon: Dumbbell },
  { to: '/games', label: 'Games', icon: Gamepad2 },
  { to: '/tests', label: 'Tests', icon: FileText },
  { to: '/community', label: 'Community', icon: MessageCircle },
]

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  async function handleSignOut() {
    await signOut()
    router.navigate({ to: '/' })
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 pb-5 pt-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
          <BarChart3 size={20} />
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold leading-tight tracking-tight text-ink-900">
            MySkills
          </p>
          <p className="truncate text-xs font-medium text-brand-600">
            Digital marketing academy
          </p>
        </div>
      </div>

      <div className="mx-4 border-t border-ink-100" />

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-5">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = pathname === to
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              className={`group flex items-center gap-3.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? 'bg-brand-50 font-medium text-brand-700'
                  : 'text-ink-400 hover:bg-ink-50 hover:text-ink-800'
              }`}
            >
              <Icon
                size={19}
                className={
                  active
                    ? 'text-brand-600'
                    : 'text-ink-400 transition-colors group-hover:text-brand-600'
                }
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="mx-4 border-t border-ink-100" />
      <div className="space-y-3 px-4 pb-6 pt-4">
        <div className="rounded-xl bg-brand-50 p-4">
          <p className="text-sm font-semibold text-ink-900">Guided weekly rhythm</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-500">
            One brief, one audit, one report. Small loops build real marketing
            judgment.
          </p>
        </div>

        <Link
          to="/profile"
          onClick={onNavigate}
          className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
            pathname === '/profile'
              ? 'border-brand-200 bg-brand-50'
              : 'border-ink-200 hover:border-ink-300 hover:bg-ink-50'
          }`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
            <User size={16} />
          </span>
          <span className="text-sm font-medium text-ink-800">Profile</span>
        </Link>

        <button
          type="button"
          onClick={handleSignOut}
          className="group flex w-full items-center gap-2.5 rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm font-medium text-ink-500 transition-colors hover:border-ink-300 hover:bg-ink-50 hover:text-ink-800"
        >
          <LogOut size={17} className="text-ink-400 transition-colors group-hover:text-brand-600" />
          Sign Out
        </button>
      </div>
    </div>
  )
}

/** Card prompt shown at the top of every page until the one-time initial
 * assessment is done. Hidden on /practice (where it's taken). */
function AssessmentCard() {
  return (
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <ClipboardCheck size={20} />
        </span>
        <div>
          <p className="text-sm font-semibold text-amber-900">Complete your initial assessment</p>
          <p className="mt-0.5 text-xs leading-relaxed text-amber-700">
            Take the one-time assessment to unlock your skill tracks and start tracking progress.
          </p>
        </div>
      </div>
      <Link
        to="/practice"
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
      >
        Start assessment
        <ArrowRight size={13} />
      </Link>
    </div>
  )
}

export function AppShell({
  children,
  wide = false,
}: {
  children: ReactNode
  wide?: boolean
}) {
  const [open, setOpen] = useState(false)
  const assessmentDone = useAssessmentDone()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const showNudge = assessmentDone === false && pathname !== '/practice'

  return (
    <div className="min-h-screen bg-[#f7f6fc]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-ink-100 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ink-100 bg-white px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <BarChart3 size={16} />
          </span>
          <span className="text-base font-semibold tracking-tight text-ink-900">
            MySkills
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-md p-2 text-ink-600 hover:text-ink-900"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-2 top-3 z-10 rounded-md p-2 text-ink-500 hover:text-ink-900"
            >
              <X size={20} />
            </button>
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <main className="lg:pl-64">
        <div
          className={`mx-auto px-4 py-6 sm:px-6 ${wide ? 'max-w-6xl' : 'max-w-4xl'}`}
        >
          {showNudge && <AssessmentCard />}
          {children}
        </div>
      </main>
    </div>
  )
}

/** Simple placeholder for sections that aren't built yet. */
export function PagePlaceholder({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description: string
  icon: IconType
}) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Icon size={24} />
      </div>
      <h1 className="mt-4 text-xl font-semibold text-ink-900">{title}</h1>
      <p className="mt-1.5 text-sm text-ink-500">{description}</p>
      <span className="mt-4 inline-block rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-500">
        Coming soon
      </span>
    </div>
  )
}
