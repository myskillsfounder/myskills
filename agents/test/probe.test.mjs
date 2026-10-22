// The clue tests and the new script checks.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { packet, score, shownOrder } from '../probe.mjs'
import { nearDuplicates, qualityFindings } from '../lib/checks.mjs'
import { allQuestions } from '../lib/content.mjs'

const DA = JSON.parse(fs.readFileSync(new URL('../../docs/programmes/Data analytics/ai-powered-data-analytics.json', import.meta.url), 'utf8'))
const clone = (x) => JSON.parse(JSON.stringify(x))

test('packets hold no answers, explanations or what a question teaches', () => {
  for (const mode of ['options', 'cards', 'blind']) {
    const text = JSON.stringify(packet(DA, mode))
    for (const key of ['correct_index', 'explanation', 'why_wrong', 'learning_outcome', 'weight', 'difficulty']) assert.ok(!text.includes(`"${key}"`), `${mode} packet has ${key}`)
  }
  assert.equal(packet(DA, 'options').items[0].question, undefined)
})

test('a perfect prober scores every question right, through the shuffle', () => {
  for (const mode of ['options', 'cards', 'blind']) {
    const p = packet(DA, mode)
    const items = mode === 'cards' ? p.modules.flatMap((m) => m.questions) : p.items
    const byId = new Map(allQuestions(DA).map((q) => [q.id, q]))
    const answers = Object.fromEntries(items.map((it) => {
      const q = byId.get(it.id)
      return [it.id, { pick: shownOrder(q, mode).indexOf(q.correct_index), sure: 3 }]
    }))
    const r = score(DA, mode, answers)
    assert.equal(r.right, r.asked, mode)
  }
})

test('options mode: far above chance is a must-fix; blind mode: a disagreement names the option by its words', () => {
  const byId = new Map(allQuestions(DA).map((q) => [q.id, q]))
  const perfect = (mode) => Object.fromEntries([...byId.values()].map((q) => [q.id, { pick: shownOrder(q, mode).indexOf(q.correct_index), sure: 3 }]))
  assert.ok(score(DA, 'options', perfect('options')).findings.some((f) => f.severity === 'must_fix' && f.target === 'programme'))
  const q = allQuestions(DA)[0]
  const wrong = (q.correct_index + 1) % 4
  const answers = { ...perfect('blind'), [q.id]: { pick: shownOrder(q, 'blind').indexOf(wrong), sure: 2 } }
  const f = score(DA, 'blind', answers).findings
  assert.equal(f.length, 1)
  assert.ok(f[0].problem.includes(q.options[wrong]))
})

test('checks: option letters in explanations, near-duplicates, an easy final', () => {
  const c = clone(DA)
  c.modules[0].quiz[0].explanation = 'Option B is right because it agrees the decision first.'
  c.modules[1].quiz[0] = { ...clone(c.modules[0].quiz[1]), id: 'da-m02-q1' }
  c.final.questions = c.final.questions.map((q) => ({ ...q, difficulty: 'Beginner' }))
  const f = qualityFindings(c)
  assert.ok(f.some((x) => x.severity === 'must_fix' && /by its letter/.test(x.problem) && x.problem.includes(c.modules[0].quiz[0].id)))
  assert.ok(nearDuplicates(c).some(([a, b]) => a.id === 'da-m01-q2' && b.id === 'da-m02-q1'))
  assert.ok(f.some((x) => x.target === 'final' && /no harder/.test(x.problem)))
  assert.ok(f.some((x) => x.target === 'final' && /Advanced or Expert/.test(x.problem)))
  assert.ok(!qualityFindings(DA).some((x) => /by its letter|nearly the same/.test(x.problem)))
})
