import { test } from 'node:test'
import assert from 'node:assert/strict'
import { notePrompt } from '../lib/coach.mjs'

const claim = (over = {}) => ({
  test: 'dm-aptitude',
  first_name: 'Asha',
  career_stage: 'final-year',
  goal: 'job',
  scores: { noticing: 9, numbers: 14, creativity: 11 },
  reflection: 'How ads go viral',
  ...over,
})

test('the results are listed highest first', () => {
  const p = notePrompt(claim())
  assert.ok(p.indexOf('numbers: 14') < p.indexOf('creativity: 11'))
  assert.ok(p.indexOf('creativity: 11') < p.indexOf('noticing: 9'))
})

test("the student's words are fenced, and cut to 500 characters", () => {
  const p = notePrompt(claim({ reflection: 'x'.repeat(900) }))
  assert.match(p, /<reflection>x{500}<\/reflection>/)
})

test('nothing written, and no name or goal: said plainly, nothing invented', () => {
  const p = notePrompt(claim({ reflection: null, first_name: null, career_stage: null, goal: null }))
  assert.match(p, /did not write anything/)
  assert.doesNotMatch(p, /first name|Where they are|Their goal/)
})

test('Global Leadership gets its own programme and next step', () => {
  const p = notePrompt(claim({ test: 'gl-aptitude', scores: { empathy: 10, 'self-awareness': 7 } }))
  assert.match(p, /Programme: Global Leadership/)
  assert.match(p, /self awareness: 7/)
  assert.match(p, /module for the skill they scored lowest on/)
})
