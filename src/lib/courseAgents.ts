/**
 * The course agents (docs/supabase-course-agents.sql, agents/ on the server):
 * the team asks the Course Architect and the Assessment Agent to draft or
 * improve a programme; the result comes back on the job with a review report,
 * and the team loads it into the draft. The playbook is what the agents have
 * learned from earlier reviews.
 */
import { supabase } from './supabase'
import type { ProgrammeContent } from './programmeEngine'

export type AgentJobStatus = 'queued' | 'running' | 'done' | 'failed' | 'cancelled'

export interface AgentUsage {
  model?: string
  calls?: number
  input_tokens?: number
  output_tokens?: number
  web_searches?: number
  cost_usd?: number
}

export interface AgentJob {
  id: string
  created_at: string
  kind: 'draft' | 'improve'
  brief: string | null
  weekly: boolean
  status: AgentJobStatus
  stage: string | null
  started_at: string | null
  heartbeat_at: string | null
  finished_at: string | null
  base_version: number | null
  usage: AgentUsage
  error: string | null
  has_result: boolean
  loaded_at: string | null
  requested_by: string | null
}

export interface AgentJobFull extends AgentJob {
  result: ProgrammeContent | null
  report: string | null
  research: string | null
  /** The draft was saved after the job started: loading the result replaces those changes. */
  draft_changed: boolean
}

export interface AgentJobs {
  jobs: AgentJob[]
  weekly: boolean
  month_cost_usd: number
  /** When the worker on the server last checked in (null: never). */
  worker_seen_at: string | null
}

/** Every programme's jobs, for the Agents' work page. */
export interface AgentWork {
  jobs: (AgentJob & { programme_slug: string; programme_title: string })[]
  /** Programmes switched to the monthly check. */
  monthly: { slug: string; title: string }[]
  month_cost_usd: number
  worker_seen_at: string | null
  worker_info: { version?: string; model?: string; job_budget_usd?: number; month_budget_usd?: number } | null
}

export interface PlaybookRule {
  id: string
  created_at: string
  updated_at: string
  rule: string
  why: string | null
  active: boolean
  source: 'seed' | 'review' | 'team'
  job_id: string | null
  /** The programme whose review taught it. */
  programme: string | null
}

function fail(error: { message?: string }): never {
  throw new Error(error.message?.trim() || 'Something went wrong.')
}

/** Null until the SQL is run. */
export async function fetchAgentJobs(programmeId: string): Promise<AgentJobs | null> {
  const { data, error } = await supabase.rpc('admin_agent_jobs', { p_programme: programmeId })
  if (error) {
    if (error.code === 'PGRST202') return null
    fail(error)
  }
  return data as AgentJobs
}

/** Null until docs/supabase-agent-work.sql is run. */
export async function fetchAgentWork(): Promise<AgentWork | null> {
  const { data, error } = await supabase.rpc('admin_agent_work')
  if (error) {
    if (error.code === 'PGRST202') return null
    fail(error)
  }
  return data as AgentWork
}

export async function fetchAgentJob(id: string): Promise<AgentJobFull | null> {
  const { data, error } = await supabase.rpc('admin_agent_job', { p_id: id })
  if (error) fail(error)
  return (data as AgentJobFull | null) ?? null
}

export async function requestAgentJob(programmeId: string, brief: string): Promise<string> {
  const { data, error } = await supabase.rpc('admin_request_agent_job', { p_programme: programmeId, p_brief: brief })
  if (error) fail(error)
  return data as string
}

export async function cancelAgentJob(id: string): Promise<void> {
  const { error } = await supabase.rpc('admin_cancel_agent_job', { p_id: id })
  if (error) fail(error)
}

export async function markAgentJobLoaded(id: string): Promise<void> {
  const { error } = await supabase.rpc('admin_mark_agent_job_loaded', { p_id: id })
  if (error) fail(error)
}

export async function setAgentWeekly(programmeId: string, on: boolean): Promise<void> {
  const { error } = await supabase.rpc('admin_set_agent_weekly', { p_programme: programmeId, p_on: on })
  if (error) fail(error)
}

export async function fetchPlaybook(): Promise<PlaybookRule[]> {
  const { data, error } = await supabase.rpc('admin_agent_playbook')
  if (error) fail(error)
  return (data ?? []) as PlaybookRule[]
}

/** Add a rule (id null) or change one. */
export async function saveRule(id: string | null, rule: string, why: string, active: boolean): Promise<string> {
  const { data, error } = await supabase.rpc('admin_save_agent_rule', { p_id: id, p_rule: rule, p_why: why, p_active: active })
  if (error) fail(error)
  return data as string
}

/** The worker checks in every 30 seconds; 3 minutes of silence means it isn't running. */
export const workerRunning = (seenAt: string | null) => Boolean(seenAt && Date.now() - new Date(seenAt).getTime() < 3 * 60_000)

export const usd = (n: number | undefined) => `$${(n ?? 0).toFixed(2)}`
