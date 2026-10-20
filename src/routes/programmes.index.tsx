import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Clock, Layers, Sparkles } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { errorMessage } from '@/lib/errors'
import { fetchCatalogue, type CatalogueEntry } from '@/lib/programmeStudent'
import { AppShell } from '@/components/app/AppShell'
import { PageHeader } from '@/components/app/PageHeader'
import { Alert, Skeleton } from '@/components/ui'

// Behind sign-in, so not in PAGE_SEO.
export const Route = createFileRoute('/programmes/')({
  beforeLoad: requireOnboarded,
  component: CataloguePage,
})

/** The two programmes that are still built into the app, alongside the engine's. */
const BUILT_IN = [
  {
    to: '/career-readiness',
    title: 'Global Leadership',
    kind: 'Personal',
    summary: 'Communication, goal setting, leadership and the life skills employers look for.',
  },
  {
    to: '/digital-marketing',
    title: 'Digital Marketing',
    kind: 'Professional',
    summary: 'Eight skill tracks of real business scenarios, from fundamentals to analytics.',
  },
] as const

function Card({ children, to, params }: { children: React.ReactNode; to: string; params?: Record<string, string> }) {
  return (
    <Link to={to} params={params as never} className="lift group flex h-full flex-col rounded-2xl border border-ink-900/[0.08] bg-white p-5">
      {children}
      <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-brand-700">
        Open <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}

function CataloguePage() {
  const [rows, setRows] = useState<CatalogueEntry[] | null | undefined>(undefined)
  const [error, setError] = useState<string>()
  useEffect(() => {
    fetchCatalogue().then(setRows, (e) => setError(errorMessage(e)))
  }, [])

  return (
    <AppShell wide>
      <PageHeader
        eyebrow="Programmes"
        title="Choose what to learn"
        description="Every programme starts with a short aptitude test, then modules that start where you are weakest, a final assessment, and a project with a mentor."
      />

      {error && (
        <Alert tone="danger" title="Couldn’t load programmes">
          <p>{error}</p>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {BUILT_IN.map((b) => (
          <Card key={b.to} to={b.to}>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Sparkles size={18} />
            </span>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">{b.kind}</p>
            <h2 className="mt-0.5 font-display text-lg font-semibold text-ink-900">{b.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-600">{b.summary}</p>
          </Card>
        ))}

        {rows === undefined && !error && <Skeleton className="h-48 w-full" />}
        {(rows ?? []).map((r) => (
          <Card key={r.slug} to="/programmes/$slug" params={{ slug: r.slug }}>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Layers size={18} />
            </span>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
              {r.kind === 'personal' ? 'Personal' : 'Professional'}
              {r.level ? ` · ${r.level}` : ''}
            </p>
            <h2 className="mt-0.5 font-display text-lg font-semibold text-ink-900">{r.title}</h2>
            {r.summary && <p className="mt-1 text-sm leading-relaxed text-ink-600">{r.summary}</p>}
            <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-500">
              <span>
                {r.modules} {r.modules === 1 ? 'module' : 'modules'} · {r.skills.length} skills
              </span>
              {r.hours ? (
                <span className="inline-flex items-center gap-1">
                  <Clock size={12} /> about {r.hours} hours
                </span>
              ) : null}
            </p>
          </Card>
        ))}
      </div>

      {rows && rows.length === 0 && (
        <p className="mt-6 text-sm text-ink-500">More programmes, like Data Analytics, are on their way.</p>
      )}
    </AppShell>
  )
}
