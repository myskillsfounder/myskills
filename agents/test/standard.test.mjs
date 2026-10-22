import { test } from 'node:test'
import assert from 'node:assert/strict'
import { linksIn, moduleEstimate, moduleScoreSummary, standardFindings } from '../lib/standard.mjs'
import { compare, scoreProgramme } from '../lib/scorecard.mjs'

const sentence = 'A shop in Pune counts its orders each week.'
const card = (title, n, extra = '') => ({ title, body: `${Array(n).fill(sentence).join(' ')}${extra}` })
const mod = (over = {}) => ({
  id: 'm1', title: 'Counting', summary: '', skill: 's', level: 'foundation', outcome: 'Count orders by week.', minutes: 60,
  learn: [card('One', 12, ' For example, 40 orders on Monday.'), card('Two', 12), card('Three', 12)],
  tasks: [{ id: 't1', prompt: 'Count the orders in the sheet.', hint: 'Use a free spreadsheet.' }],
  reflection: { prompt: 'What surprised you?', hint: '' },
  quiz: [], ...over,
})
const programme = (modules, questions = []) => ({ overview: { hours: 2 }, skills: [], modules, final: { questions }, project: {} })
const kinds = (c) => standardFindings(c).map((f) => `${f.target} ${f.standard}`)

test('a sound module has no Module Standard findings', () => {
  assert.deepEqual(standardFindings(programme([mod()])), [])
})

test('the estimate counts reading, tasks, reflection and quiz', () => {
  // 3 cards of 12 × 9 words + 6, titles 3, task 9 → about 3 minutes reading; 20 + 5 + 3 × 1.5
  const m = mod({ quiz: [{}, {}, {}] })
  assert.equal(moduleEstimate(m), 32)
})

test('no outcome, thin teaching, no worked example', () => {
  const k = kinds(programme([mod({ outcome: '', learn: [card('Only', 5)] })]))
  assert.ok(k.includes('module:m1 outcome'))
  assert.equal(k.filter((x) => x === 'module:m1 explanation').length, 2)
})

test('code counts as a worked example', () => {
  const code = card('Query', 30, '\n\nSELECT city, COUNT(*)\nFROM orders\nGROUP BY city;')
  assert.ok(!standardFindings(programme([mod({ learn: [code] })])).some((f) => /example/.test(f.problem)))
})

test('long cards and long sentences', () => {
  const long = { title: 'Long', body: `${Array(30).fill('word').join(' ')} and then ${Array(10).fill('more').join(' ')}.` }
  const k = kinds(programme([mod({ learn: [card('Big', 20), card('Two', 10), long] })]))
  assert.ok(k.includes('module:m1 explanation')) // the 20-sentence card is over 170 words
  assert.ok(k.includes('module:m1 inclusion'))
})

test('a paid tool needs a free alternative named', () => {
  const paid = mod({ tasks: [{ id: 't1', prompt: 'Build it in Power BI Pro.', hint: '' }] })
  assert.ok(kinds(programme([paid])).includes('module:m1 inclusion'))
  const both = mod({ tasks: [{ id: 't1', prompt: 'Build it in Power BI Pro, or the free Looker Studio.', hint: '' }] })
  assert.ok(!kinds(programme([both])).includes('module:m1 inclusion'))
})

test('time: too little for the work, and more than the content fills', () => {
  assert.ok(kinds(programme([mod({ minutes: 15 })])).includes('module:m1 time'))
  assert.ok(kinds(programme([mod({ minutes: 240 })])).includes('module:m1 time'))
  assert.ok(!kinds(programme([mod({ minutes: 45 })])).includes('module:m1 time'))
})

test('explanations too short to teach go to the Assessment Architect', () => {
  const f = standardFindings(programme([mod()], [{ id: 'f1', explanation: 'Because it is right.' }]))
  assert.equal(f.length, 1)
  assert.equal(f[0].owner, 'assessment')
})

test('links are found with where they are', () => {
  const c = programme([mod({ learn: [{ title: 'L', body: 'See https://support.google.com/x. Then go on.' }] })])
  assert.deepEqual([...linksIn(c)], [['https://support.google.com/x', 'module:m1']])
})

const all = (n) => ({ outcome: n, explanation: n, practice: n, feedback: n, relevance: n, time: n, progression: n, inclusion: n })

test('module scores: the bar, missing modules, and what a built-in can’t change', () => {
  const c = programme([mod(), mod({ id: 'm2' })])
  assert.equal(moduleScoreSummary({ module_scores: [{ module: 'm1', scores: all(4) }] }, c).meetsBar, false) // m2 not scored
  const ok = moduleScoreSummary({ module_scores: [{ module: 'm1', scores: all(4) }, { module: 'm2', scores: { ...all(5), time: 4 } }] }, c)
  assert.equal(ok.meetsBar, true)
  assert.equal(ok.min, 4)
  const low = moduleScoreSummary({ module_scores: [{ module: 'm1', scores: { ...all(4), practice: 3 } }, { module: 'm2', scores: all(4) }] }, c)
  assert.deepEqual(low.belowBar, ['m1: practice 3'])
  const held = moduleScoreSummary({ module_scores: [{ module: 'm1', scores: { ...all(4), practice: 3 }, held_by_structure: ['practice'] }, { module: 'm2', scores: { ...all(4), practice: null }, not_in_file: ['practice'] }] }, c)
  assert.equal(held.meetsBar, true)
  assert.equal(moduleScoreSummary({}, c), null)
})

test('the scorecard carries the standard and compares it', () => {
  const c = programme([mod()])
  const a = scoreProgramme(c, { review: { findings: [], module_scores: [{ module: 'm1', scores: { ...all(4), practice: 2 } }] } })
  const b = scoreProgramme(c, { review: { findings: [], module_scores: [{ module: 'm1', scores: all(4) }] } })
  assert.equal(a.standard.modules.belowBar.length, 1)
  const lines = compare(a, b)
  assert.ok(lines.includes('better: lowest module score 2 → 4'))
  assert.ok(lines.includes('better: module dimensions below 4 1 → 0'))
})
