// The course team's track record: one entry per /course-team job, kept in
// agents/track-record.json (committed; no answers or student data in it).
// It answers two questions over time:
//   Are the agents getting better at writing programmes?  The first review of
//     each new draft: problems per 10 questions, rounds to "ready", and which
//     playbook rules were broken again.
//   Does a programme get better for students?  Question health before and
//     after a version is published (the "outcome" entries).
//
//   node agents/track.mjs add <programme.json> --job draft|improve|health --rounds <n> [--lessons <n>] [--note "..."]
//        from <file without .json>.scorecard.json: its first row (the baseline,
//        or for a draft the first review) and its last row
//   node agents/track.mjs outcome <programme.json> --learners <learners.json> --version <n> [--built-in]
//        how students answer a published version
//   node agents/track.mjs report
import fs from 'node:fs'
import { learnerScore } from './lib/scorecard.mjs'

const RECORD = new URL('./track-record.json', import.meta.url)
const PLAYBOOK = new URL('./playbook.md', import.meta.url)
const args = process.argv.slice(2)
const [cmd, file] = args
const opt = (name) => {
  const i = args.indexOf(name)
  return i > 0 ? args[i + 1] : undefined
}
const read = (f) => JSON.parse(fs.readFileSync(f, 'utf8'))
const record = fs.existsSync(RECORD) ? read(RECORD) : { jobs: [], outcomes: [] }
const save = () => fs.writeFileSync(RECORD, JSON.stringify(record, null, 2) + '\n')
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
const show = (v) => (v === null || v === undefined ? '-' : v)
const name = (f) => f.split(/[\\/]/).pop().replace(/(-v\d+)?\.json$/, '')

// What a job entry keeps from a scorecard row.
const brief = (r) =>
  r && {
    stage: r.stage,
    questions: r.questions,
    mustPer10: r.mustPer10,
    shouldPer10: r.shouldPer10,
    rightIsLongestPct: r.rightIsLongestPct,
    verdict: r.review?.verdict ?? null,
    byCategory: r.review?.byCategory ?? {},
    rulesBroken: r.review?.rulesBroken ?? {},
  }

/** The playbook's rule numbers and the date each was added (rules without a date are the first set). */
function playbookRules() {
  const text = fs.readFileSync(PLAYBOOK, 'utf8')
  const rules = {}
  for (const m of text.matchAll(/^(\d+)\.\s+(.*)$/gm)) {
    const date = /\((?:added )?(\d{4}-\d{2}-\d{2})\)/.exec(m[2])?.[1] ?? '2026-10-21'
    rules[m[1]] = { date, text: m[2].replace(/\*Why:\*.*$/, '').trim().slice(0, 90) }
  }
  return rules
}

if (cmd === 'add') {
  const job = opt('--job')
  if (!file || !['draft', 'improve', 'health'].includes(job) || !opt('--rounds')) {
    console.error('Usage: node agents/track.mjs add <programme.json> --job draft|improve|health --rounds <n> [--lessons <n>] [--note "..."]')
    process.exit(1)
  }
  const card = read(file.replace(/\.json$/, '') + '.scorecard.json')
  const entry = {
    date: today,
    programme: name(file),
    job,
    rounds: Number(opt('--rounds')),
    lessonsAdded: Number(opt('--lessons') ?? 0),
    first: brief(card.rows[0]),
    last: brief(card.rows.at(-1)),
    note: opt('--note') ?? '',
  }
  record.jobs.push(entry)
  save()
  console.log(JSON.stringify(entry, null, 1))
} else if (cmd === 'outcome') {
  if (!file || !opt('--learners') || !opt('--version')) {
    console.error('Usage: node agents/track.mjs outcome <programme.json> --learners <learners.json> --version <n>')
    process.exit(1)
  }
  const entry = { date: today, programme: name(file), version: Number(opt('--version')), ...learnerScore(read(file), read(opt('--learners'))) }
  record.outcomes.push(entry)
  save()
  console.log(JSON.stringify(entry, null, 1))
} else if (cmd === 'report') {
  const rules = playbookRules()
  const lines = []
  const jobs = record.jobs

  lines.push('JOBS (problems per 10 questions: must-fix / should-fix, automatic checks + review)')
  for (const j of jobs) {
    const f = j.first ?? {}
    const l = j.last ?? {}
    lines.push(`  ${j.date}  ${j.programme}  ${j.job}  ${j.rounds} round(s)  start ${show(f.mustPer10)}/${show(f.shouldPer10)} → end ${show(l.mustPer10)}/${show(l.shouldPer10)}  ${l.verdict ?? ''}`)
  }

  // The agents' own skill: how good is a new draft at its first review?
  const drafts = jobs.filter((j) => j.job === 'draft')
  lines.push('', 'NEW DRAFTS AT THEIR FIRST REVIEW (are the Architects getting better?)')
  if (drafts.length < 2) lines.push(`  ${drafts.length} draft(s) so far: a trend needs at least two.`)
  for (const j of drafts) lines.push(`  ${j.date}  ${j.programme}: ${show(j.first?.mustPer10)} must-fix per 10 questions, right answer longest ${show(j.first?.rightIsLongestPct)}%, ready after ${j.rounds} round(s)`)

  // Rules broken at a job's first review although they were already in the
  // playbook: the rule isn't working.
  const repeats = {}
  for (const j of jobs) {
    for (const [r, n] of Object.entries(j.first?.rulesBroken ?? {})) {
      if (rules[r] && rules[r].date < j.date) (repeats[r] ??= []).push(`${j.programme} ${j.date} (${n})`)
    }
  }
  lines.push('', 'PLAYBOOK RULES BROKEN AFTER THEY WERE WRITTEN')
  const rep = Object.entries(repeats).sort((a, b) => b[1].length - a[1].length)
  if (!rep.length) lines.push('  None yet.')
  for (const [r, where] of rep) {
    lines.push(`  Rule ${r} (${rules[r].text}…): broken in ${where.join(', ')}`)
    lines.push(`    → ${where.length >= 2 ? 'Not sticking. Make it an automatic check in agents/lib/checks.mjs if a script can see it; otherwise rewrite it with a worked example.' : 'Watch it: one more and it needs changing.'}`)
  }

  const cats = {}
  for (const j of jobs) for (const [c, n] of Object.entries(j.first?.byCategory ?? {})) cats[c] = (cats[c] ?? 0) + n
  lines.push('', 'WHAT FIRST REVIEWS FIND MOST (all jobs)')
  if (!Object.keys(cats).length) lines.push('  No tagged findings yet.')
  for (const [c, n] of Object.entries(cats).sort((a, b) => b[1] - a[1])) lines.push(`  ${c}: ${n}`)

  lines.push('', 'STUDENTS (Question health per published version; questions judged need 30+ first-time answers)')
  if (!record.outcomes.length) lines.push('  No outcome recorded yet.')
  for (const o of record.outcomes) {
    lines.push(`  ${o.date}  ${o.programme} v${o.version}${o.since ? ` (answers since ${o.since})` : ''}: ${o.judged} of ${o.matched} judged, ${o.healthyPct ?? '-'}% healthy, separation ${o.meanSeparation ?? '-'}, ${o.meanCorrectPct ?? '-'}% right on average`)
  }
  console.log(lines.join('\n'))
} else {
  console.error('Usage: node agents/track.mjs add|outcome|report …')
  process.exit(1)
}
