// Right-answer positions: the tidy step must leave no pattern a learner could learn.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { allQuestions, answerPattern, balancePositions } from '../lib/content.mjs'

const DA = JSON.parse(fs.readFileSync(new URL('../../docs/programmes/Data analytics/ai-powered-data-analytics.json', import.meta.url), 'utf8'))

// Every quiz keyed C-A-D-B, as the old fixed cycle left them.
const cycled = (c) => {
  let turn = 0
  const put = (q) => {
    const target = [2, 0, 3, 1][turn++ % 4]
    const others = q.options.filter((_, i) => i !== q.correct_index)
    others.splice(target, 0, q.options[q.correct_index])
    return { ...q, options: others, correct_index: target }
  }
  return { ...c, modules: c.modules.map((m) => ({ ...m, quiz: m.quiz.map(put) })), final: { ...c.final, questions: c.final.questions.map(put) } }
}

test('a repeating key is a pattern, even when A, B, C and D are evenly used', () => {
  assert.match(answerPattern(cycled(DA)), /repeat every 4 questions/)
})

test('tidying leaves no pattern, keeps every right answer, and is repeatable', () => {
  const before = cycled(DA)
  const { content: after, moved } = balancePositions(before)
  assert.equal(answerPattern(after), null)
  assert.ok(moved > 0)
  const a = allQuestions(before)
  const b = allQuestions(after)
  b.forEach((q, i) => {
    assert.equal(q.options[q.correct_index], a[i].options[a[i].correct_index])
    assert.deepEqual([...q.options].sort(), [...a[i].options].sort())
  })
  const keys = after.modules.map((m) => m.quiz.map((q) => q.correct_index).join(''))
  assert.ok(new Set(keys).size >= keys.length - 2, 'quiz keys vary')
  assert.deepEqual(balancePositions(before).content, after)
})

test('a programme without a pattern is left alone', () => {
  const tidy = balancePositions(cycled(DA)).content
  assert.equal(balancePositions(tidy).moved, 0)
})
