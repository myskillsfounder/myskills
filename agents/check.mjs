// The course team's checks on a programme file, for the agents that run in
// Claude Code on Paul's PC (.claude/agents, /course-team). Same checks as the
// server worker: what Publish refuses, and the test-writing checks.
//
//   node agents/check.mjs docs/programmes/x.json            findings and numbers, as JSON
//   node agents/check.mjs docs/programmes/x.json --tidy     also set weights and spread the
//                                                           right answers (not for built-in)
//   add --built-in for Global Leadership or Digital Marketing
import fs from 'node:fs'
import { publishProblems, qualityFindings, stats } from './lib/checks.mjs'
import { WEIGHT, balancePositions } from './lib/content.mjs'

const [file, ...flags] = process.argv.slice(2)
if (!file) {
  console.error('Usage: node agents/check.mjs <programme.json> [--tidy] [--built-in]')
  process.exit(1)
}
const locked = flags.includes('--built-in')
let c = JSON.parse(fs.readFileSync(file, 'utf8'))

if (flags.includes('--tidy')) {
  // Weights always follow difficulty; answer positions only move on an
  // engine programme (a built-in one's option order is shared with its pages).
  const weigh = (q) => ({ ...q, weight: WEIGHT[q.difficulty] ?? 10 })
  c = { ...c, modules: (c.modules ?? []).map((m) => ({ ...m, quiz: (m.quiz ?? []).map(weigh) })), final: { ...c.final, questions: (c.final?.questions ?? []).map(weigh) } }
  if (!locked) c = balancePositions(c).content
  fs.writeFileSync(file, JSON.stringify(c, null, 2) + '\n')
}

const findings = qualityFindings(c, { locked })
console.log(
  JSON.stringify(
    {
      ready_to_publish: publishProblems(c).length === 0,
      must_fix: findings.filter((f) => f.severity === 'must_fix').length,
      should_fix: findings.filter((f) => f.severity === 'should_fix').length,
      stats: stats(c),
      findings,
    },
    null,
    1,
  ),
)
