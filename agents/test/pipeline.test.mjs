// The whole pipeline with a stand-in for Claude, so it can be tested
// without an API key or spending anything: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { Usage } from '../lib/claude.mjs'
import { Cancelled, runJob } from '../lib/pipeline.mjs'
import { publishProblems, qualityFindings } from '../lib/checks.mjs'
import { prefixFor, structureOf } from '../lib/content.mjs'

const DA = JSON.parse(fs.readFileSync(new URL('../../docs/programmes/ai-powered-data-analytics.json', import.meta.url), 'utf8'))
const words = (n) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ')
const clone = (x) => JSON.parse(JSON.stringify(x))

function question(i, difficulty = 'Intermediate') {
  return {
    id: `q${i}`,
    title: `Case ${i}`,
    scenario: `A coaching centre in Pune has a problem, case ${i}.`,
    context: null,
    question: `What should the analyst do first in case ${i}?`,
    options: [`Check the totals against the source ${i}`, `Build a dashboard of every metric ${i}`, `Email the founder the raw export ${i}`, `Delete rows that look unusual ${i}`],
    correct_index: 0,
    explanation: 'Checking totals first catches errors before anything is shared.',
    why_wrong: 'A dashboard of everything answers nothing; raw exports confuse; deleting rows hides problems.',
    learning_outcome: 'Check before you share.',
    difficulty,
    topic: `Topic ${i}`,
  }
}

function moduleFixture(id) {
  return {
    id,
    title: `Module ${id}`,
    summary: 'A module.',
    skill: 'data-literacy',
    level: 'foundation',
    outcome: 'Do the thing.',
    minutes: 90,
    learn: [1, 2, 3].map((n) => ({ title: `Card ${n}`, body: words(90) })),
    tasks: [1, 2].map((n) => ({ id: `t${n}`, title: `Task ${n}`, prompt: 'Do a realistic task.', hint: 'A hint.' })),
    reflection: { prompt: 'What did you learn?', hint: 'Be specific.' },
    quiz: [1, 2, 3, 4].map((n) => question(n)),
  }
}

const blueprint = {
  overview: { summary: 'Learn cyber security basics.', audience: 'Students', outcomes: ['Spot phishing', 'Secure an account'], level: 'beginner', hours: 30 },
  skills: [
    { id: 'data-literacy', name: 'Security thinking', description: 'Thinking like an attacker.' },
    { id: 'Network Basics', name: 'Network basics', description: 'How networks work.' },
  ],
  aptitude: [
    { id: '', skill: 'data-literacy', statement: 'I check links before I click them.', reverse: false },
    { id: '', skill: 'data-literacy', statement: 'I use the same password everywhere.', reverse: true },
    { id: '', skill: 'data-literacy', statement: 'I read permission requests.', reverse: false },
    { id: '', skill: 'network-basics', statement: 'I know what my router does.', reverse: false },
    { id: '', skill: 'network-basics', statement: 'I ignore network warnings.', reverse: true },
    { id: '', skill: 'network-basics', statement: 'I check which Wi-Fi I join.', reverse: false },
  ],
  project: { brief: 'Audit a small business.', deliverables: ['A report'], rubric: [{ id: '', name: 'Findings', description: 'Real risks found' }] },
  modules: [1, 2, 3].map((n) => ({ title: `M${n}`, summary: 's', skill: n === 3 ? 'network-basics' : 'data-literacy', level: 'foundation', outcome: 'o', minutes: 90, teaches: ['a'], practise: ['b'] })),
  final_plan: 'Everything.',
}

/** A stand-in for lib/claude.mjs. `review(round)` returns each round's review; `revise(label, prompt)` each revision. */
function fakeClaude({ review, revise }) {
  const calls = []
  let round = 0
  return {
    calls,
    async research({ label }) {
      calls.push(label)
      return { brief: 'Employers want SQL and Excel [source](https://example.com).', sources: [{ url: 'https://example.com', title: 'Example' }] }
    },
    async json({ label, prompt }) {
      calls.push(label)
      if (label === 'blueprint') return clone(blueprint)
      if (label.startsWith('module ')) {
        const m = moduleFixture(/id "([^"]+)"/.exec(prompt)[1])
        if (label === 'module 3') m.skill = 'network-basics'
        return m
      }
      if (label === 'final') return { questions: [1, 2, 3, 4, 5].map((n) => question(n, 'Advanced')) }
      if (label.startsWith('review')) return review(++round)
      if (label.startsWith('revise')) return revise(label, prompt)
      throw new Error(`unexpected call ${label}`)
    },
  }
}

const now = (prompt, label) => JSON.parse(new RegExp(`${label}:\\n\`\`\`json\\n([\\s\\S]*?)\\n\`\`\``).exec(prompt)[1])
const ready = () => ({ verdict: 'ready', summary: 'Good.', strengths: ['Clear'], findings: [], lessons: [] })

function ctx(claude, extra = {}) {
  const stages = []
  return {
    stages,
    claude,
    usage: new Usage('test'),
    budgetUsd: 25,
    today: '21 October 2026',
    progress: async (s) => {
      stages.push(s)
      return 'running'
    },
    ...extra,
  }
}

test('improve: fixes what the review and the checks found, keeps ids, records lessons', async () => {
  const claude = fakeClaude({
    review: (round) =>
      round === 1
        ? {
            verdict: 'needs_work',
            summary: 'Two things to fix.',
            strengths: ['Indian context'],
            findings: [
              { target: 'module:da-m02', severity: 'should_fix', problem: 'Card 1 is vague.', fix: 'Add an example.', source: '' },
              { target: 'da-m03-q2', severity: 'must_fix', problem: 'Question da-m03-q2 has two right answers.', fix: 'Reword option B.', source: 'https://example.com' },
              { target: 'programme', severity: 'idea', problem: 'Add a module on Power BI Copilot.', fix: '', source: '' },
            ],
            lessons: [{ rule: 'Give every Learn card a worked example from an Indian business.', why: 'Card 1 of module 2 had none.' }],
          }
        : ready(),
    revise: (label, prompt) => {
      if (label.startsWith('revise final')) {
        return { questions: now(prompt, 'The final assessment now').map((q) => ({ ...q, context: null, why_wrong: 'Each is wrong for a reason.', learning_outcome: 'Something.' })) }
      }
      const m = now(prompt, 'The module now')
      m.learn = m.learn.map((l) => ({ ...l, body: `${l.body} ${words(40)}` }))
      m.quiz = m.quiz.map((q) => ({ ...q, context: null }))
      if (m.id === 'da-m03') m.quiz[1] = { ...m.quiz[1], options: ['A new option', ...m.quiz[1].options.slice(1)] }
      if (m.id === 'da-m02') m.quiz.push({ ...question(9), id: '' })
      return m
    },
  })
  const c = ctx(claude)
  const out = await runJob({ job: { id: 'j', kind: 'improve', brief: null }, programme: { slug: 'ai-powered-data-analytics', title: 'AI powered Data Analytics', kind: 'professional', source: 'engine' }, content: clone(DA), playbook: [] }, c)

  assert.equal(c.claude.calls.filter((x) => x.startsWith('review')).length, 2)
  assert.deepEqual(publishProblems(out.result), [])
  // Every flagged part was revised: the module the review named, the module
  // of the question it named, the modules with short cards, and the final.
  const revised = c.claude.calls.filter((x) => x.startsWith('revise'))
  const flagged = qualityFindings(DA).filter((f) => f.target.startsWith('module:')).map((f) => f.target.slice(7))
  for (const id of new Set(['da-m02', 'da-m03', ...flagged])) assert.ok(revised.includes(`revise ${id} 1`), id)
  assert.ok(revised.includes('revise final 1'))
  // Ids kept; the new question got a new, unique id.
  const m2 = out.result.modules.find((m) => m.id === 'da-m02')
  assert.equal(m2.quiz.length, 5)
  assert.equal(m2.quiz[4].id, 'da-m02-q5')
  assert.equal(out.result.modules[2].quiz[1].id, 'da-m03-q2')
  assert.ok(out.result.modules[2].quiz[1].options.includes('A new option'))
  assert.equal(qualityFindings(out.result).length, 0)
  assert.deepEqual(out.lessons, [{ rule: 'Give every Learn card a worked example from an Indian business.', why: 'Card 1 of module 2 had none.' }])
  assert.match(out.report, /## Verdict\n\n\*\*Ready/)
  assert.match(out.report, /Add a module on Power BI Copilot/)
  assert.match(out.report, /Cleaning messy data|Spreadsheets/)
  assert.match(out.research, /example\.com/)
})

test('draft: plans, writes every module and the final, and the result can be published', async () => {
  const claude = fakeClaude({ review: ready, revise: () => assert.fail('nothing to revise') })
  const c = ctx(claude)
  const out = await runJob({ job: { id: 'j', kind: 'draft', brief: 'For beginners' }, programme: { slug: 'cyber-security-basics', title: 'Cyber Security Basics', kind: 'professional', source: 'engine' }, content: { modules: [] }, playbook: [{ rule: 'Use Indian examples.', why: '' }] }, c)
  assert.deepEqual(publishProblems(out.result), [])
  const p = prefixFor('cyber-security-basics')
  assert.equal(p, 'csb')
  assert.deepEqual(out.result.modules.map((m) => m.id), ['csb-m01', 'csb-m02', 'csb-m03'])
  assert.equal(out.result.modules[0].quiz[0].id, 'csb-m01-q1')
  assert.equal(out.result.final.questions[0].id, 'csb-f01')
  assert.deepEqual(out.result.skills.map((s) => s.id), ['data-literacy', 'network-basics'])
  assert.equal(out.result.aptitude.items[0].id, 'csb-a01')
  // The fixtures put every right answer first; they are spread out now.
  const pos = [0, 0, 0, 0]
  for (const q of [...out.result.modules.flatMap((m) => m.quiz), ...out.result.final.questions]) pos[q.correct_index]++
  assert.ok(Math.max(...pos) <= 6, pos.join(','))
  assert.equal(out.result.modules[0].quiz[0].weight, 10)
  assert.equal(out.result.final.questions[0].weight, 15)
  assert.ok(c.stages.includes('Writing modules (3 of 3 done)'))
})

test('built-in: a revision that adds or removes questions is refused, the structure stays', async () => {
  const claude = fakeClaude({
    review: (round) =>
      round === 1
        ? { verdict: 'needs_work', summary: '', strengths: [], findings: [{ target: 'module:da-m01', severity: 'must_fix', problem: 'Too long.', fix: 'Cut a question.', source: '' }], lessons: [] }
        : ready(),
    revise: (label, prompt) => {
      if (label.startsWith('revise final')) return { questions: now(prompt, 'The final assessment now').map((q) => ({ ...q, context: null, why_wrong: 'Because.', learning_outcome: 'This.' })) }
      const m = now(prompt, 'The module now')
      m.quiz = m.quiz.map((q) => ({ ...q, context: null }))
      if (m.id === 'da-m01') m.quiz.pop()
      else m.learn = m.learn.map((l) => ({ ...l, body: `${l.body} ${words(40)}` }))
      return m
    },
  })
  const c = ctx(claude)
  const base = clone(DA)
  const out = await runJob({ job: { id: 'j', kind: 'improve', brief: null }, programme: { slug: 'digital-marketing', title: 'Digital Marketing', kind: 'professional', source: 'built-in' }, content: base, playbook: [] }, c)
  assert.deepEqual(structureOf(out.result), structureOf(DA))
  assert.deepEqual(out.result.modules[0], DA.modules[0])
  assert.match(out.report, /kept as it was, because the revision changed the number of tasks or questions/)
  // Built-in option order is never reshuffled.
  assert.deepEqual(out.result.modules[3].quiz.map((q) => q.correct_index), DA.modules[3].quiz.map((q) => q.correct_index))
})

test('cancelled: stops at the next step', async () => {
  const claude = fakeClaude({ review: ready, revise: () => ({}) })
  const c = ctx(claude, { progress: async () => 'cancelled' })
  await assert.rejects(runJob({ job: { id: 'j', kind: 'improve' }, programme: { slug: 'x-y', title: 'X', source: 'engine' }, content: clone(DA), playbook: [] }, c), Cancelled)
  assert.equal(claude.calls.length, 0)
})

test('budget: stops reviewing once the job has spent its budget, and says so', async () => {
  const claude = fakeClaude({ review: ready, revise: () => ({}) })
  const c = ctx(claude, { budgetUsd: 1 })
  c.usage.output_tokens = 100_000 // $2
  const out = await runJob({ job: { id: 'j', kind: 'improve' }, programme: { slug: 'x-y', title: 'X', source: 'engine' }, content: clone(DA), playbook: [] }, c)
  assert.equal(claude.calls.filter((x) => x.startsWith('review')).length, 0)
  assert.match(out.report, /reached its \$1 budget/)
})

test('budget: stops before a revision that would go past the budget', async () => {
  const claude = fakeClaude({
    review: () => ({ verdict: 'needs_work', summary: '', strengths: [], findings: [{ target: 'module:da-m01', severity: 'must_fix', problem: 'x', fix: 'y', source: '' }], lessons: [] }),
    revise: () => assert.fail('should not revise'),
  })
  const c = ctx(claude, { budgetUsd: 2 })
  c.usage.output_tokens = 90_000 // $1.80 spent: a $1.50 review would pass $2, so it stops first
  const out = await runJob({ job: { id: 'j', kind: 'improve' }, programme: { slug: 'x-y', title: 'X', source: 'engine' }, content: clone(DA), playbook: [] }, c)
  assert.equal(claude.calls.filter((x) => x.startsWith('revise')).length, 0)
  assert.match(out.report, /Stopped before review round 1/)
})
