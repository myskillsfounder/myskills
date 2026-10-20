import { useCallback, useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowRight, Bot, CalendarClock, RefreshCw, Wallet } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { fetchAgentWork, usd, workerRunning, type AgentWork } from '@/lib/courseAgents'
import { RequireSection } from '@/components/admin/AdminSectionGate'
import { Playbook } from '@/components/admin/programme/AgentsPanel'
import { Alert, Badge, EmptyState, PageHeader, Skeleton } from '@/components/ui'

// Every course-agent job across all programmes, the playbook the agents
// follow, and what they have spent (docs/supabase-agent-work.sql). Asking
// for a job stays on each programme's Agents tab.
export const Route = createFileRoute('/admin/_layout/agent-work')({
  component: () => (
    <RequireSection section="programmes">
      <AgentWorkPage />
    </RequireSection>
  ),
})

type Job = AgentWork['jobs'][number]
type Filter = 'all' | 'active' | 'done' | 'failed'

const STATUS: Record<Job['status'], { label: string; tone: 'neutral' | 'brand' | 'success' | 'danger' }> = {
  queued: { label: 'Waiting', tone: 'neutral' },
  running: { label: 'Working', tone: 'brand' },
  done: { label: 'Finished', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

const when = (s: string | null) =>
  s ? new Date(s).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : ''
const isActive = (j: Job) => j.status === 'queued' || j.status === 'running'
const FILTERS: { id: Filter; label: string; match: (j: Job) => boolean }[] = [
  { id: 'all', label: 'All', match: () => true },
  { id: 'active', label: 'Working now', match: isActive },
  { id: 'done', label: 'Finished', match: (j) => j.status === 'done' },
  { id: 'failed', label: 'Failed or cancelled', match: (j) => j.status === 'failed' || j.status === 'cancelled' },
]

function Card({ icon: Icon, label, children }: { icon: typeof Bot; label: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
        <Icon size={13} /> {label}
      </p>
      <div className="mt-2 text-sm text-ink-800">{children}</div>
    </div>
  )
}

function AgentWorkPage() {
  const [data, setData] = useState<AgentWork | null>()
  const [error, setError] = useState<string>()
  const [filter, setFilter] = useState<Filter>('all')

  const load = useCallback(() => {
    fetchAgentWork().then(setData, (e) => setError(errorMessage(e)))
  }, [])
  useEffect(load, [load])

  const working = data?.jobs.some(isActive) ?? false
  useEffect(() => {
    if (!working) return
    const t = setInterval(load, 15_000)
    return () => clearInterval(t)
  }, [working, load])

  const running = data ? workerRunning(data.worker_seen_at) : false
  const budget = data?.worker_info?.month_budget_usd
  const shown = data ? data.jobs.filter(FILTERS.find((f) => f.id === filter)!.match) : []

  return (
    <>
      <PageHeader
        eyebrow="Courses"
        title="Agents’ work"
        subtitle="What the course agents are doing across every programme. The Assessment Agent researches the field and reviews; the Course Architect writes and revises. Ask for a job on a programme’s Agents tab, in the Course engine; read and load each result there."
      />

      {error && (
        <Alert tone="danger" title="Couldn’t load the agents’ work">
          <p>{error}</p>
        </Alert>
      )}
      {data === null && (
        <Alert tone="info" title="This page isn’t set up yet">
          <p>Run docs/supabase-agent-work.sql in Supabase.</p>
        </Alert>
      )}
      {data === undefined && !error && <Skeleton className="h-64 w-full" />}

      {data && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card icon={Bot} label="Agents’ server">
              {running ? <Badge tone="success">Running</Badge> : <Badge tone="warning">Not running</Badge>}
              <p className="mt-1.5 text-xs text-ink-500">
                {data.worker_seen_at ? `Last checked in ${when(data.worker_seen_at)}` : 'Has never checked in'}
                {data.worker_info?.model ? ` · ${data.worker_info.model}` : ''}
              </p>
            </Card>
            <Card icon={Wallet} label="Spent this month">
              <p className="font-display text-2xl font-semibold text-ink-900">{usd(data.month_cost_usd)}</p>
              <p className="mt-0.5 text-xs text-ink-500">
                {budget ? `of the ${usd(budget)} monthly limit` : 'Monthly limit set on the server'}
                {data.worker_info?.job_budget_usd ? ` · up to ${usd(data.worker_info.job_budget_usd)} a job` : ''}
              </p>
            </Card>
            <Card icon={CalendarClock} label="Checked every month">
              {data.monthly.length ? (
                <ul className="space-y-0.5">
                  {data.monthly.map((p) => (
                    <li key={p.slug}>
                      <Link to="/admin/programmes/$slug" params={{ slug: p.slug }} search={{ tab: 'agents' }} className="font-medium text-brand-700 hover:underline">
                        {p.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-ink-600">None yet. Switch it on in a programme’s Agents tab.</p>
              )}
            </Card>
          </div>

          <section>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5" role="tablist">
                {FILTERS.map((f) => {
                  const n = data.jobs.filter(f.match).length
                  return (
                    <button
                      key={f.id}
                      type="button"
                      role="tab"
                      aria-selected={filter === f.id}
                      onClick={() => setFilter(f.id)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${filter === f.id ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100'}`}
                    >
                      {f.label} <span className="opacity-60">{n}</span>
                    </button>
                  )
                })}
              </div>
              <button type="button" onClick={load} className="inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-900">
                <RefreshCw size={12} /> Refresh
              </button>
            </div>

            {shown.length === 0 ? (
              <div className="mt-3">
                <EmptyState
                  icon={Bot}
                  title={data.jobs.length ? 'Nothing here' : 'No jobs yet'}
                  description={data.jobs.length ? 'Try another filter.' : 'Open a programme in the Course engine and use its Agents tab to draft or improve it.'}
                />
              </div>
            ) : (
              <ul className="card mt-3 divide-y divide-ink-900/[0.06] overflow-hidden">
                {shown.map((j) => (
                  <li key={j.id}>
                    <Link
                      to="/admin/programmes/$slug"
                      params={{ slug: j.programme_slug }}
                      search={{ tab: 'agents' }}
                      className="group flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 transition-colors hover:bg-ink-50"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-ink-900">{j.programme_title}</span>
                          <span className="text-sm text-ink-600">{j.kind === 'draft' ? 'Draft' : j.weekly ? 'Monthly check' : 'Improve'}</span>
                          <Badge tone={STATUS[j.status].tone}>{STATUS[j.status].label}</Badge>
                          {j.loaded_at && <Badge tone="success">Loaded</Badge>}
                          {j.status === 'done' && !j.loaded_at && <Badge tone="warning">To read</Badge>}
                        </span>
                        <span className="mt-0.5 block text-xs text-ink-500">
                          {when(j.created_at)}
                          {j.requested_by ? ` · ${j.requested_by}` : ''}
                          {j.usage?.cost_usd ? ` · ${usd(j.usage.cost_usd)}` : ''}
                          {isActive(j) && j.stage ? ` · ${j.stage}…` : ''}
                        </span>
                        {j.status === 'failed' && j.error && (
                          <span className="mt-1 flex items-start gap-1.5 text-xs text-red-700">
                            <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {j.error}
                          </span>
                        )}
                      </span>
                      <ArrowRight size={16} className="shrink-0 text-ink-400 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="card p-5 sm:p-6">
            <Playbook />
          </div>
        </div>
      )}
    </>
  )
}
