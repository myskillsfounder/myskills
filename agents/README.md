# Course agents

The Course Architect and the Assessment Agent: they draft new programmes and
improve existing ones on the course engine, working together until the review
has nothing left to fix. The team asks for a job on a programme's **Agents**
tab in the admin; this worker runs on the MySkills server, does the work, and
leaves the result and a review report on the job. Nothing reaches students
until someone loads the result into the draft, reads it, saves and publishes.

## What a job does

1. **Research** (Assessment Agent). It searches the web for what the field
   needs now in India: roles, tools and recent changes, laws, beginner
   mistakes and free resources. Every claim comes with its source.
2. **Draft** (Course Architect), for a programme with no modules yet. It plans
   the programme, writes each module (three at a time), then writes the final
   assessment. Code sets the ids, weights and answer positions.
3. **Review** (Assessment Agent). It runs the automatic checks
   (`lib/checks.mjs`), the same ones Publish runs plus test-writing checks such
   as "the right answer is the longest option". Then it reviews every part
   against the research and the playbook.
4. **Revise** (Course Architect). It fixes every must-fix and should-fix
   finding, revising each module, the final and the overview separately. For
   Global Leadership and Digital Marketing, a revision that would add, remove or
   reorder anything is refused.
5. Steps 3 and 4 repeat until the review finds nothing to fix. There are at
   most 4 reviews, and a job stops early if it reaches its spending limit.
6. **Report.** The job ends with a review report, the research brief, and up
   to 5 new **playbook** rules. The playbook is how the Assessment Agent trains
   the Architect: both agents follow its rules on every later job, and the team
   can switch any rule off.

Programmes switched to **Check it every month** get an improve job queued
once a month.

## Cost

Claude Opus 5.5 costs $4 per million tokens in and $20 per million out. Web
searches cost $10 per 1,000.

| Job | Usual cost |
| --- | --- |
| Drafting a programme | $5–10 (capped at the job limit) |
| Improving a programme, or a monthly check | $3–10 |

Two limits in `.env` cap spending:

- `AGENT_MONTHLY_BUDGET_USD` (default 20): the most the agents spend in a month.
  A job may only spend what is left of it; a draft needs at least $8 left to
  start, an improve job $2.
- `AGENT_JOB_BUDGET_USD` (default 10): the most one job spends. A job stops
  before a review or revision that would take it past its limit, and reports
  what it finished.

The Agents tab shows the month's spending.

## Setting it up (once, on the server)

1. **Anthropic account.** At console.anthropic.com, create the MySkills
   organisation, add billing, and create an API key. Web search must be allowed
   for the organisation (Console settings); without it, research fails.
2. **Database.** Run `docs/supabase-course-agents.sql` in the Supabase SQL
   editor.
3. **The worker.** On the VPS, after `git pull`:

   ```bash
   cd /root/frontend-app/agents
   node -v                  # needs 20.6 or newer
   npm ci --omit=dev
   cp .env.example .env
   nano .env                # paste the Anthropic key and the Supabase service_role key
   chmod 600 .env
   node --env-file=.env worker.mjs --check
   ```

   `--check` should print that Supabase is connected and the Anthropic key
   works.
4. **Keep it running** with systemd:

   ```bash
   which node               # if this isn't /usr/bin/node, put its path in the service file's ExecStart
   cp myskills-agents.service /etc/systemd/system/
   systemctl daemon-reload
   systemctl enable --now myskills-agents
   journalctl -u myskills-agents -f     # watch it work; Ctrl+C to stop watching
   ```

The Agents tab shows "Agents' server running" once the worker checks in.

## After a deploy that changes `agents/`

```bash
cd /root/frontend-app/agents && npm ci --omit=dev && systemctl restart myskills-agents
```

A job that is running when the worker restarts is marked failed. Ask for it
again.

## Testing without spending anything

```bash
npm install
npm test
```

The tests run the whole pipeline with a stand-in for Claude: draft, improve, a
built-in programme, cancel and budget.

To run one real job and stop, use `node --env-file=.env worker.mjs --once`.

## Files

| File | What it does |
| --- | --- |
| `worker.mjs` | The loop: check in, queue monthly checks, take a job, run it, save the result |
| `lib/pipeline.mjs` | One job: research, draft, review and revise |
| `lib/prompts.mjs` | What each agent is told: the house style, the roles and every task |
| `lib/schemas.mjs` | The JSON shapes the agents answer in |
| `lib/checks.mjs` | The automatic checks. Keep `publishProblems` in step with `programme_content_problems()` |
| `lib/content.mjs` | Ids, weights, answer positions, the built-in lock, and merging revisions |
| `lib/claude.mjs` | Calls to Claude, and the running cost |
| `lib/report.mjs` | The review report |
