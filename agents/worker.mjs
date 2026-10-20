// The course agents' worker. Runs on the MySkills server (see README.md):
// every 30 seconds it checks in, queues any weekly checks that are due, and
// takes the oldest job the team has asked for. One job at a time.
//
//   node --env-file=.env worker.mjs           run (as the systemd service does)
//   node --env-file=.env worker.mjs --check   check the settings and keys, then stop
//   node --env-file=.env worker.mjs --once    run one job if there is one, then stop
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_MODEL, Usage, makeClaude } from './lib/claude.mjs'
import { Cancelled, runJob } from './lib/pipeline.mjs'

const VERSION = '1.0.0'
const env = process.env
const MODEL = env.AGENT_MODEL || DEFAULT_MODEL
const JOB_BUDGET = Number(env.AGENT_JOB_BUDGET_USD || 25)
const MONTH_BUDGET = Number(env.AGENT_MONTHLY_BUDGET_USD || 150)
const POLL_MS = 30_000
const WEEKLY_MS = 60 * 60_000

const log = (...a) => console.log(new Date().toISOString(), ...a)

function settings() {
  const missing = ['ANTHROPIC_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].filter((k) => !env[k])
  if (missing.length) {
    console.error(`Missing in agents/.env: ${missing.join(', ')}. See agents/README.md.`)
    process.exit(1)
  }
}

settings()
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })

async function rpc(fn, args) {
  const { data, error } = await db.rpc(fn, args)
  if (error) throw new Error(`${fn}: ${error.message}`)
  return data
}

const ping = () => rpc('agent_worker_ping', { p_info: { version: VERSION, model: MODEL, job_budget_usd: JOB_BUDGET, month_budget_usd: MONTH_BUDGET } })

let current = null
let stopping = false

async function finish(id, fields) {
  await rpc('agent_finish_job', {
    p_id: id,
    p_ok: fields.ok,
    p_result: fields.result ?? null,
    p_report: fields.report ?? null,
    p_research: fields.research ?? null,
    p_usage: fields.usage ?? null,
    p_error: fields.error ?? null,
    p_lessons: fields.lessons ?? [],
  })
}

async function work() {
  const claim = await rpc('agent_claim_job')
  if (!claim) return false
  const { job, programme } = claim
  current = job.id
  log(`Job ${job.id}: ${job.kind} "${programme.title}"`)
  const usage = new Usage(MODEL)
  if (Number(claim.month_cost_usd) >= MONTH_BUDGET) {
    await finish(job.id, { ok: false, usage: usage.toJSON(), error: `This month’s agent budget ($${MONTH_BUDGET}) is used up. Raise AGENT_MONTHLY_BUDGET_USD on the server, or wait for next month.` })
    current = null
    return true
  }
  const claude = makeClaude({ apiKey: env.ANTHROPIC_API_KEY, model: MODEL, usage, log: (m) => log(`  ${m}`) })
  try {
    const out = await runJob(claim, {
      claude,
      usage,
      budgetUsd: JOB_BUDGET,
      log: (m) => log(`  ${m}`),
      progress: (stage, u) => rpc('agent_job_progress', { p_id: job.id, p_stage: stage, p_usage: u }),
    })
    await finish(job.id, { ok: true, result: out.result, report: out.report, research: out.research, usage: usage.toJSON(), lessons: out.lessons })
    log(`Job ${job.id} done: $${usage.cost.toFixed(2)}`)
  } catch (e) {
    const cancelled = e instanceof Cancelled
    log(`Job ${job.id} ${cancelled ? 'cancelled' : `failed: ${e.stack ?? e}`}`)
    await finish(job.id, {
      ok: false,
      usage: usage.toJSON(),
      error: cancelled ? null : `${e.message ?? e}`.slice(0, 1500),
    }).catch((x) => log(`Couldn’t record the end of job ${job.id}: ${x.message}`))
  } finally {
    current = null
  }
  return true
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const args = process.argv.slice(2)
  if (args.includes('--check')) {
    await ping()
    log('Supabase: connected, and the course-agent functions are installed.')
    const name = await makeClaude({ apiKey: env.ANTHROPIC_API_KEY, model: MODEL, usage: new Usage(MODEL) }).ping()
    log(`Anthropic: the key works, model ${name}. Budgets: $${JOB_BUDGET} per job, $${MONTH_BUDGET} a month.`)
    return
  }
  if (args.includes('--once')) {
    await ping()
    if (!(await work())) log('No job waiting.')
    return
  }
  log(`Course agents worker ${VERSION} started (model ${MODEL}).`)
  let lastWeekly = 0
  while (!stopping) {
    try {
      await ping()
      if (Date.now() - lastWeekly > WEEKLY_MS) {
        const n = await rpc('agent_queue_weekly')
        if (n) log(`Queued ${n} weekly ${n === 1 ? 'check' : 'checks'}.`)
        lastWeekly = Date.now()
      }
      if (await work()) continue
    } catch (e) {
      log(`Problem: ${e.message ?? e}`)
    }
    await sleep(POLL_MS)
  }
}

// A restart mid-job: record it, so the team can ask again straight away.
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, async () => {
    stopping = true
    if (current) {
      log(`Stopping during job ${current}.`)
      await finish(current, { ok: false, error: 'The agents’ server restarted while working on this job. Ask again.' }).catch(() => {})
    }
    process.exit(0)
  })
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
