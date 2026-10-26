import { test } from 'node:test'
import assert from 'node:assert/strict'
import { publishProblems } from '../lib/checks.mjs'

// Just enough of a programme for the Foundation rule.
const programme = (finalSkills) => ({
  skills: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }],
  modules: [
    { id: 'm1', skill: 'a', level: 'foundation' },
    { id: 'm2', skill: 'b', level: 'intermediate' },
  ],
  final: { questions: finalSkills.map((skill, i) => ({ id: `f${i}`, ...(skill ? { skill } : {}) })) },
})
const foundation = (p, builtIn) => publishProblems(p, builtIn).filter((x) => x.startsWith('Foundation'))

test('each foundation skill needs 2 tagged final questions', () => {
  assert.deepEqual(foundation(programme([null, null, null, null, null])), ['Foundation assessment: skill "a" needs at least 2 questions'])
  assert.deepEqual(foundation(programme(['a', 'a', 'b', null, null])), [])
})

test('only foundation modules count, unless none is marked foundation', () => {
  const p = programme(['a', 'a'])
  assert.deepEqual(foundation(p), [])
  p.modules[0].level = 'intermediate'
  assert.deepEqual(foundation(p), ['Foundation assessment: skill "b" needs at least 2 questions'])
})

test('a built-in programme skips the count, but not an unknown skill', () => {
  assert.deepEqual(foundation(programme([null]), true), [])
  assert.deepEqual(foundation(programme(['zz', 'a', 'a']), true), ['Foundation assessment: a question names a skill that does not exist'])
})
