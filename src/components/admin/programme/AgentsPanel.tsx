import { useCallback, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, BookOpenCheck, Bot, CircleStop, Download, Pencil, Plus, RefreshCw, Sparkles } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { withDefaults, type ProgrammeContent } from '@/lib/programmeEngine'
import {
  cancelAgentJob,
  fetchAgentJob,
  fetchAgentJobs,
  fetchPlaybook,
  markAgentJobLoaded,
  requestAgentJob,
  saveRule,
  setAgentWeekly,
  usd,
  workerRunning,
  type AgentJob,
  type AgentJobFull,
  type AgentJobs,
  type PlaybookRule,
} from '@/lib/courseAgents'
import { Alert, Badge, Button, Skeleton } from '@/components/ui'
import { Markdown } from './Markdown'

const STATUS: Record<AgentJob['status'], { label: string; tone: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' }> = {
  queued: { label: 'Waiting', tone: 'neutral' },
  running: { label: 'Working', tone: 'brand' },
  done: { label: 'Finished', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

const when = (s: string | null) =>
  s ? new Date(s).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : ''

const active = (j: AgentJob) => j.status === 'queued' || j.status === 'running'

/** One job, opened: the report, the research, and loading the result. */
function JobDetail({ id, dirty, onLoad }: { id: string; dirty: boolean; onLoad: (c: ProgrammeContent, jobId: string) => void }) {
  const [job, setJob] = useState<AgentJobFull | null>()
  const [view, setView] = useState<'report' | 'research'>('report')
  const [error, setError] = useState<string>()

  useEffect(() => {
    fetchAgentJob(id).then(setJob, (e) => setError(errorMessage(e)))
  }, [id])

  if (error) return <p className="mt-3 text-sm text-red-700">{error}</p>
  if (job === undefined) return <Skeleton className="mt-3 h-40 w-full" />
  if (!job) return null

  const load = () => {
    if (!job.result) return
    const warn = [
      dirty && 'You have unsaved changes in the editor; they will be replaced.',
      job.draft_changed && 'The draft was saved after the agents started, so changes made since then will be replaced.',
    ].filter(Boolean)
    if (!window.confirm([...warn, 'Put the agents’ version into the editor? Nothing is saved until you press Save draft.'].join('\n\n'))) return
    onLoad(withDefaults(job.result), job.id)
  }

  return (
    <div className="mt-3 space-y-3 border-t border-ink-900/[0.06] pt-3">
      {job.error && (
        <Alert tone="danger" title="What went wrong">
          <p>{job.error}</p>
        </Alert>
      )}
      {job.result && (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" icon={Download} onClick={load}>
            Load into the draft
          </Button>
          {job.draft_changed && <span className="text-xs text-amber-700">The draft has changed since this job started.</span>}
          {job.loaded_at && <span className="text-xs text-ink-500">Loaded {when(job.loaded_at)}</span>}
        </div>
      )}
      {(job.report || job.research) && (
        <div className="flex gap-1.5" role="tablist">
          {(['report', 'research'] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold ${view === v ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100'}`}
            >
              {v === 'report' ? 'Review report' : 'Research'}
            </button>
          ))}
        </div>
      )}
      {view === 'report' && job.report && (
        <div className="max-h-[36rem] overflow-y-auto rounded-xl bg-ink-50 p-4">
          <Markdown text={job.report} />
        </div>
      )}
      {view === 'research' && job.research && (
        <div className="max-h-[36rem] overflow-y-auto rounded-xl bg-ink-50 p-4">
          <Markdown text={job.research} />
        </div>
      )}
    </div>
  )
}

const SOURCE = { seed: 'From the first review', team: 'Added by the team', review: 'Learned' }

/** What the agents have learned: rules both follow on every job (on the Agents’ work page). */
export function Playbook() {
  const [rules, setRules] = useState<PlaybookRule[]>()
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [rule, setRule] = useState('')
  const [why, setWhy] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  const load = useCallback(() => {
    fetchPlaybook().then(setRules, (e) => setError(errorMessage(e)))
  }, [])
  useEffect(load, [load])

  async function save(id: string | null, r: string, w: string, on: boolean) {
    setBusy(true)
    setError(undefined)
    try {
      await saveRule(id, r, w, on)
      setEditing(null)
      load()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const form = (id: string | null, on: boolean) => (
    <div className="space-y-2">
      <textarea value={rule} onChange={(e) => setRule(e.target.value)} rows={2} className="field text-sm" placeholder="The rule, as an instruction: “Every task must…”" />
      <input value={why} onChange={(e) => setWhy(e.target.value)} className="field text-sm" placeholder="Why (optional)" />
      <div className="flex gap-2">
        <Button size="sm" disabled={busy || rule.trim().length < 10} onClick={() => void save(id, rule, why, on)}>
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
          Cancel
        </Button>
      </div>
    </div>
  )

  return (
    <section>
      <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
        <BookOpenCheck size={18} className="text-brand-700" /> The playbook
      </h3>
      <p className="mt-1 text-sm text-ink-600">
        How the Assessment Agent trains the Course Architect: rules learned from reviews, which both agents follow on every
        programme. Switch off any rule you disagree with, or add your own. Shared by all programmes.
      </p>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      {!rules ? (
        <Skeleton className="mt-3 h-24 w-full" />
      ) : (
        <ol className="mt-3 space-y-2">
          {rules.map((r) => (
            <li key={r.id} className={`rounded-xl border p-3 ${r.active ? 'border-ink-200 bg-white' : 'border-ink-100 bg-ink-50 opacity-70'}`}>
              {editing === r.id ? (
                form(r.id, r.active)
              ) : (
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={r.active}
                    disabled={busy}
                    onChange={(e) => void save(r.id, r.rule, r.why ?? '', e.target.checked)}
                    aria-label={r.active ? 'Switch this rule off' : 'Switch this rule on'}
                    className="mt-1 h-4 w-4 shrink-0 accent-brand-600"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink-900">{r.rule}</p>
                    {r.why && <p className="mt-0.5 text-xs text-ink-500">Why: {r.why}</p>}
                    <p className="mt-1 text-[11px] text-ink-400">
                      {SOURCE[r.source]}
                      {r.source === 'review' && r.programme ? ` reviewing ${r.programme}` : ''} · {when(r.created_at)}
                      {r.active ? '' : ' · off'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRule(r.rule)
                      setWhy(r.why ?? '')
                      setEditing(r.id)
                    }}
                    className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                    aria-label="Edit this rule"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
      <div className="mt-3">
        {editing === 'new' ? (
          form(null, true)
        ) : (
          <Button
            size="sm"
            variant="secondary"
            icon={Plus}
            onClick={() => {
              setRule('')
              setWhy('')
              setEditing('new')
            }}
          >
            Add a rule
          </Button>
        )}
      </div>
    </section>
  )
}

/**
 * The Agents tab of a programme: ask the Course Architect and the
 * Assessment Agent to draft or improve it, follow the job, read the review
 * and load the result into the draft.
 */
export function AgentsPanel({
  programmeId,
  builtIn,
  hasModules,
  dirty,
  onLoad,
}: {
  programmeId: string
  builtIn: boolean
  hasModules: boolean
  dirty: boolean
  onLoad: (c: ProgrammeContent) => void
}) {
  const [data, setData] = useState<AgentJobs | null>()
  const [brief, setBrief] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(() => {
    fetchAgentJobs(programmeId).then(setData, (e) => setError(errorMessage(e)))
  }, [programmeId])
  useEffect(load, [load])

  // Follow a job while it works.
  const working = data?.jobs.some(active) ?? false
  useEffect(() => {
    if (!working) return
    const t = setInterval(load, 10_000)
    return () => clearInterval(t)
  }, [working, load])

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setError(undefined)
    try {
      await fn()
      load()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  if (data === undefined && !error) return <Skeleton className="h-64 w-full" />
  if (data === null) {
    return (
      <Alert tone="info" title="The course agents aren’t set up yet">
        <p>Run docs/supabase-course-agents.sql in Supabase, then set up the worker on the server (agents/README.md).</p>
      </Alert>
    )
  }

  const draft = !hasModules && !builtIn
  const running = data ? workerRunning(data.worker_seen_at) : false

  return (
    <div className="space-y-6">
      <section>
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
          <Bot size={19} className="text-brand-700" /> Course agents
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-ink-600">
          The <span className="font-semibold text-ink-800">Assessment Agent</span> researches the field on the web, reviews every
          part like an examiner, and sends what it finds to the <span className="font-semibold text-ink-800">Course Architect</span>,
          who {draft ? 'writes the programme and ' : ''}fixes it. They go round until the review has nothing left to fix (at most
          four reviews). The result comes back here with a review report. Nothing reaches students until you load it into the draft,
          read it, save and publish.
        </p>
        {data && (
          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-500">
            {running ? (
              <Badge tone="success">Agents’ server running</Badge>
            ) : (
              <Badge tone="warning">Agents’ server not running{data.worker_seen_at ? ` since ${when(data.worker_seen_at)}` : ''}</Badge>
            )}
            <span>Spent this month: {usd(data.month_cost_usd)}</span>
          </p>
        )}
      </section>

      {error && (
        <Alert tone="danger" title="Couldn’t do that">
          <p>{error}</p>
        </Alert>
      )}
      {loaded && (
        <Alert tone="success" title="Loaded into the editor">
          <p>Read it through in the other tabs, then press Save draft. Nothing is saved until you do.</p>
        </Alert>
      )}

      {data && (
        <section className="rounded-2xl border border-ink-200 bg-white p-4">
          <label className="block text-sm font-medium text-ink-800">
            {draft ? 'What should the programme be? (optional)' : 'What should they look at? (optional)'}
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={3}
              maxLength={4000}
              className="field mt-1"
              placeholder={
                draft
                  ? 'For example: for final-year commerce and BCA students; job-ready for junior analyst roles; Excel, SQL, Power BI and Python; 30 to 40 hours.'
                  : 'For example: check the tools are current for 2026; make module 7 more hands-on; harder final questions.'
              }
            />
          </label>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button
              icon={Sparkles}
              disabled={busy || working}
              onClick={() =>
                void run(async () => {
                  await requestAgentJob(programmeId, brief)
                  setBrief('')
                })
              }
            >
              {draft ? 'Draft this programme' : 'Improve this programme'}
            </Button>
            <span className="text-xs text-ink-500">
              {working ? 'They’re already working on it.' : `Takes about 15 to 40 minutes and usually costs $5 to $20.`}
              {!running && ' The agents’ server isn’t running, so the job will wait until it is.'}
            </span>
          </div>
          {builtIn && (
            <p className="mt-2 text-xs text-ink-500">
              Built into the app: the agents reword and correct, but keep every module, task, question, statement and skill in place.
            </p>
          )}
          {!draft && (
            <label className="mt-3 flex items-start gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                checked={data.weekly}
                disabled={busy}
                onChange={(e) => void run(() => setAgentWeekly(programmeId, e.target.checked))}
                className="mt-0.5 h-4 w-4 accent-brand-600"
              />
              <span>
                Check it every month: research what has changed in the field and improve the programme. Each check usually costs $3
                to $10, and its result waits here for you.
              </span>
            </label>
          )}
        </section>
      )}

      {data && data.jobs.length > 0 && (
        <section>
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-ink-900">Jobs</h3>
            <button type="button" onClick={load} className="inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-900">
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
          <ul className="mt-2 space-y-2">
            {data.jobs.map((j) => (
              <li key={j.id} className="rounded-2xl border border-ink-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink-900">
                      {j.kind === 'draft' ? 'Draft' : j.weekly ? 'Monthly check' : 'Improve'}
                      <Badge tone={STATUS[j.status].tone}>{STATUS[j.status].label}</Badge>
                      {j.loaded_at && <Badge tone="success">Loaded</Badge>}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {when(j.created_at)}
                      {j.requested_by ? ` · ${j.requested_by}` : ''}
                      {j.base_version ? ` · from v${j.base_version}` : ''}
                      {j.usage?.cost_usd ? ` · ${usd(j.usage.cost_usd)}` : ''}
                      {j.finished_at ? ` · finished ${when(j.finished_at)}` : ''}
                    </p>
                    {active(j) && j.stage && <p className="mt-1 text-sm text-brand-800">{j.stage}…</p>}
                    {j.brief && <p className="mt-1 line-clamp-2 text-xs text-ink-600">“{j.brief}”</p>}
                    {j.status === 'failed' && j.error && (
                      <p className="mt-1 flex items-start gap-1.5 text-xs text-red-700">
                        <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {j.error}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {active(j) && (
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={CircleStop}
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm('Stop this job? What it has spent so far is still charged.')) void run(() => cancelAgentJob(j.id))
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                    {!active(j) && (j.has_result || j.status === 'failed') && (
                      <Button size="sm" variant={open === j.id ? 'dark' : 'secondary'} onClick={() => setOpen(open === j.id ? null : j.id)}>
                        {open === j.id ? 'Close' : j.has_result ? 'Open the result' : 'Details'}
                      </Button>
                    )}
                  </div>
                </div>
                {open === j.id && (
                  <JobDetail
                    id={j.id}
                    dirty={dirty}
                    onLoad={(c, jobId) => {
                      onLoad(c)
                      setLoaded(true)
                      void markAgentJobLoaded(jobId).then(load, () => {})
                    }}
                  />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {data && (
        <p className="border-t border-ink-900/[0.06] pt-4 text-sm text-ink-600">
          The rules both agents follow (the playbook), every programme’s jobs and this month’s spending are on{' '}
          <Link to="/admin/agent-work" className="font-semibold text-brand-700 underline underline-offset-2">
            Agents’ work
          </Link>
          .
        </p>
      )}
    </div>
  )
}
