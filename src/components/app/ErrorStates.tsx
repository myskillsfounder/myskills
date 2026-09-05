import type { ReactNode } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { Compass, Home, RefreshCw, TriangleAlert } from 'lucide-react'

/**
 * Full-page fallbacks for a thrown render and an unmatched URL.
 *
 * These deliberately don't use AppShell: the shell reads auth and router state,
 * so if it is what threw, rendering it again inside the boundary would throw a
 * second time and leave the same white screen this is here to prevent.
 */
function CenteredState({
  icon,
  title,
  description,
  children,
  details,
}: {
  icon: ReactNode
  title: string
  description: string
  children: ReactNode
  details?: ReactNode
}) {
  return (
    <div className="surface-paper flex min-h-screen items-center justify-center px-4 py-16">
      <div className="card w-full max-w-md px-6 py-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ink-100 text-ink-500">
          {icon}
        </div>
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink-900">{title}</h1>
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-600">
          {description}
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
          {children}
        </div>
        {details}
      </div>
    </div>
  )
}

const primaryButton =
  'press inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 sm:w-auto'

const secondaryButton =
  'press inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink-300 bg-white px-6 py-3 text-sm font-medium text-ink-800 transition-colors hover:bg-ink-100 sm:w-auto'

export function RouteErrorState({ error, reset }: ErrorComponentProps) {
  const router = useRouter()

  return (
    <CenteredState
      icon={<TriangleAlert size={26} />}
      title="Something went wrong"
      description="This page hit an unexpected error. Trying again usually fixes it — if it doesn't, head back home."
      details={
        // Useful while developing, and noise (or a leak) in production, where
        // the copy above is all a visitor should see.
        import.meta.env.DEV ? (
          <pre className="mt-5 max-h-48 overflow-auto rounded-xl bg-ink-900 px-4 py-3 text-left text-xs leading-relaxed text-ink-100">
            {error instanceof Error ? `${error.name}: ${error.message}` : String(error)}
          </pre>
        ) : undefined
      }
    >
      <button
        type="button"
        className={primaryButton}
        onClick={() => {
          // reset() clears the boundary; invalidate() re-runs the route's
          // loaders, so a retry refetches rather than replaying stale data.
          reset()
          void router.invalidate()
        }}
      >
        <RefreshCw size={16} />
        Try again
      </button>
      <Link to="/" className={secondaryButton}>
        <Home size={16} />
        Go home
      </Link>
    </CenteredState>
  )
}

export function RouteNotFoundState() {
  return (
    <CenteredState
      icon={<Compass size={26} />}
      title="Page not found"
      description="That link doesn't lead anywhere. It may have moved, or the address might have a typo."
    >
      <Link to="/" className={primaryButton}>
        <Home size={16} />
        Go home
      </Link>
      <button type="button" className={secondaryButton} onClick={() => window.history.back()}>
        Go back
      </button>
    </CenteredState>
  )
}
