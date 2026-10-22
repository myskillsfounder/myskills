import { test } from 'node:test'
import assert from 'node:assert/strict'
import { compare, learnerFlags, learnerScore, reviewScore, scoreProgramme } from '../lib/scorecard.mjs'

const q = (id, options, correct_index, extra = {}) => ({
  id, title: id, scenario: 'A case.', question: 'Which?', options, correct_index,
  explanation: 'Because.', why_wrong: 'B is late; C is early; D is wrong.', learning_outcome: 'Judge it.',
  difficulty: 'Intermediate', topic: 'Timing', weight: 10, ...extra,
})
const programme = (questions) => ({
  overview: { summary: 'S', audience: 'A', outcomes: ['Do'], level: 'beginner', hours: 2 },
  skills: [{ id: 's', name: 'S', description: 'D' }],
  aptitude: { items: [{ id: 'a1', skill: 's', statement: 'I do', reverse: false }, { id: 'a2', skill: 's', statement: 'I skip', reverse: true }] },
  modules: [{ id: 'm1', title: 'M', summary: '', skill: 's', level: 'foundation', outcome: 'o', minutes: 60, learn: [], tasks: [], reflection: { prompt: '', hint: '' }, quiz: questions }],
  final: { minutes: 30, pass_percent: 60, questions: [] },
  project: { brief: 'B', deliverables: ['d'], rubric: [{ id: 'r1', name: 'R', description: 'D' }] },
})

test('the longest-answer rate and per-10 counts', () => {
  const long = 'a much longer and more careful right answer'
  const c = programme([q('q1', [long, 'no', 'nah', 'nope'], 0), q('q2', ['aaaa', 'bbbb', 'cccc', 'dddd'], 1), q('q3', ['aaaa', 'bbbb', 'cccc', 'dddd'], 2), q('q4', ['aaaa', 'bbbb', 'cccc', 'dddd'], 3)])
  const s = scoreProgramme(c)
  assert.equal(s.questions, 4)
  assert.equal(s.rightIsLongestPct, 25)
  assert.equal(s.complete.whyWrong, 100)
})

test('review counts by owner, category and playbook rule; ideas left out', () => {
  const r = reviewScore({ verdict: 'needs_work', findings: [
    { severity: 'must_fix', owner: 'assessment', category: 'question-design', rule: 1 },
    { severity: 'should_fix', owner: 'course', category: 'time', rule: [3] },
    { severity: 'idea', owner: 'course', category: 'coverage', rule: 1 },
  ] })
  assert.equal(r.must, 1)
  assert.equal(r.should, 1)
  assert.deepEqual(r.rulesBroken, { 1: 1, 3: 1 })
  assert.deepEqual(r.byCategory, { 'question-design': 1, time: 1 })
})

test('learner flags need 30 answers and match the admin page', () => {
  assert.deepEqual(learnerFlags({ answered: 10, correct_pct: 50, correct_index: 0, option_counts: [5, 5, 0, 0], separation: 20 }), [])
  const f = learnerFlags({ answered: 40, correct_pct: 95, correct_index: 0, option_counts: [38, 1, 1, 0], separation: 5 })
  assert.ok(f.includes('too-easy') && f.includes('no-separation') && f.includes('unused-option'))
})

test('learner score counts only this programme\'s questions', () => {
  const c = programme([q('q1', ['a', 'b', 'c', 'd'], 0)])
  const s = learnerScore(c, { since: '2026-11-01', questions: [
    { question_id: 'q1', answered: 40, correct_pct: 60, correct_index: 0, option_counts: [24, 6, 6, 4], separation: 30 },
    { question_id: 'other', answered: 40, correct_pct: 99, correct_index: 0, option_counts: [40, 0, 0, 0], separation: 0 },
  ] })
  assert.equal(s.matched, 1)
  assert.equal(s.healthyPct, 100)
})

test('compare says what got better and which rules are still broken', () => {
  const lines = compare(
    { mustPer10: 2, rightIsLongestPct: 78, review: { rulesBroken: { 1: 3 } } },
    { mustPer10: 0.5, rightIsLongestPct: 24, review: { rulesBroken: { 1: 1 } } },
  )
  assert.ok(lines.some((l) => l.startsWith('better: must-fix')))
  assert.ok(lines.some((l) => l.startsWith('still broken: playbook rule 1')))
})
