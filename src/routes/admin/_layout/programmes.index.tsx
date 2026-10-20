import { useEffect, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, Layers, Plus } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { createProgramme, fetchProgrammes, slugify, type ProgrammeKind, type ProgrammeSummary } from '@/lib/programmeEngine'
import { RequireSection } from '@/components/admin/AdminSectionGate'
import { Alert, Badge, Button, EmptyState, PageHeader, Skeleton } from '@/components/ui'

export const Route = createFileRoute('/admin/_layout/programmes/')({
  component: () => (
    <RequireSection section="programmes">
      <ProgrammesPage />
    </RequireSection>
  ),
})

const STATUS: Record<ProgrammeSummary['status'], { label: string; tone: 'success' | 'brand' | 'neutral' }> = {
  published: { label: 'Live', tone: 'success' },
  draft: { label: 'Not published yet', tone: 'brand' },
  archived: { label: 'Archived', tone: 'neutral' },
}

function NewProgramme({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [touched, setTouched] = useState(false)
  const [kind, setKind] = useState<ProgrammeKind>('professional')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  async function create() {
    setBusy(true)
    setError(undefined)
    try {
      await createProgramme(slug, title, kind)
      onDone()
      void navigate({ to: '/admin/programmes/$slug', params: { slug } })
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }

  return (
    <div className="card mb-6 p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold text-ink-900">New programme</h2>
      <p className="mt-0.5 text-sm text-ink-600">It starts as a draft. Nothing is shown to students until it is complete and published.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="block text-sm font-medium text-ink-800">
          Name
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (!touched) setSlug(slugify(e.target.value))
            }}
            placeholder="Data Analytics"
            className="field mt-1"
          />
        </label>
        <label className="block text-sm font-medium text-ink-800">
          Web address
          <input
            value={slug}
            onChange={(e) => {
              setTouched(true)
              setSlug(slugify(e.target.value))
            }}
            placeholder="data-analytics"
            className="field mt-1"
          />
          <span className="mt-1 block text-xs font-normal text-ink-500">myskills.org.in/programmes/{slug || '…'}</span>
        </label>
        <label className="block text-sm font-medium text-ink-800">
          Kind
          <select value={kind} onChange={(e) => setKind(e.target.value as ProgrammeKind)} className="field mt-1">
            <option value="professional">Professional (like Digital Marketing)</option>
            <option value="personal">Personal (like Global Leadership)</option>
          </select>
        </label>
      </div>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <div className="mt-4">
        <Button icon={Plus} disabled={busy || title.trim().length < 3 || slug.length < 3} onClick={() => void create()}>
          {busy ? 'Creating…' : 'Create the draft'}
        </Button>
      </div>
    </div>
  )
}

/** Every programme on the course engine, and a way to start a new one. */
function ProgrammesPage() {
  const [rows, setRows] = useState<ProgrammeSummary[] | null | undefined>(undefined)
  const [error, setError] = useState<string>()
  const [adding, setAdding] = useState(false)

  const load = () => {
    fetchProgrammes().then(setRows, (e) => setError(errorMessage(e)))
  }
  useEffect(load, [])

  return (
    <>
      <PageHeader
        eyebrow="Programmes"
        title="Course engine"
        subtitle="Every programme, edited as a draft, checked, then published. Global Leadership and Digital Marketing are here too: publishing them changes what students see on their own pages."
        actions={
          rows && !adding ? (
            <Button icon={Plus} onClick={() => setAdding(true)}>
              New programme
            </Button>
          ) : undefined
        }
      />

      {error && (
        <Alert tone="danger" title="Couldn’t load programmes">
          <p>{error}</p>
        </Alert>
      )}
      {rows === null && (
        <Alert tone="info" title="The course engine isn’t set up yet">
          <p>Run docs/supabase-course-engine.sql in Supabase.</p>
        </Alert>
      )}
      {rows === undefined && !error && <Skeleton className="h-48 w-full" />}

      {rows && (
        <>
          {adding && <NewProgramme onDone={load} />}
          {rows.length === 0 ? (
            !adding && (
              <EmptyState
                icon={Layers}
                title="No programmes yet"
                description="Start one with “New programme”. Data Analytics is planned first, drafted by the Course Architect."
              />
            )
          ) : (
            <ul className="card divide-y divide-ink-900/[0.06] overflow-hidden">
              {rows.map((p) => (
                <li key={p.id}>
                  <Link
                    to="/admin/programmes/$slug"
                    params={{ slug: p.slug }}
                    className="group flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 transition-colors hover:bg-ink-50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-base font-semibold text-ink-900">{p.title}</span>
                        <Badge tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Badge>
                        {p.source === 'built-in' && <Badge tone="neutral">Built into the app</Badge>}
                        {p.draft_version && p.current_version && <Badge tone="warning">Draft v{p.draft_version} in progress</Badge>}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-500">
                        /programmes/{p.slug} · {p.kind === 'personal' ? 'Personal' : 'Professional'} · {p.modules}{' '}
                        {p.modules === 1 ? 'module' : 'modules'} · {p.questions} questions
                        {p.current_version ? ` · live: v${p.current_version}` : ''}
                      </span>
                    </span>
                    {p.problems > 0 ? (
                      <span className="text-xs font-semibold text-amber-700">
                        {p.problems} {p.problems === 1 ? 'thing' : 'things'} to finish
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700">Ready to publish</span>
                    )}
                    <ArrowRight size={16} className="shrink-0 text-ink-400 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  )
}
