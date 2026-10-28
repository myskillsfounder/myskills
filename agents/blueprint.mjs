// The assessment blueprint's tables, written by script so they always match
// the programme file: what each test holds, a row per question, which skills
// each part covers, and where the right answers sit. The Assessment Architect
// writes the judgement (outcomes, time, prerequisites, the review) in
// <file>.assessment.md and links to these tables instead of copying them.
//
//   node agents/blueprint.mjs docs/programmes/x.json      writes <file without .json>.assessment-tables.md
import fs from 'node:fs'
import { WEIGHT, allQuestions } from './lib/content.mjs'

const file = process.argv[2]
if (!file) {
  console.error('Usage: node agents/blueprint.mjs <programme.json>')
  process.exit(1)
}
const c = JSON.parse(fs.readFileSync(file, 'utf8'))
const out = file.replace(/\.json$/, '') + '.assessment-tables.md'

const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim()
const marks = (q) => q.weight ?? WEIGHT[q.difficulty] ?? 10
const mix = (qs) => ['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((d) => qs.filter((q) => q.difficulty === d).length).join(' / ')
const mean = (qs) => (qs.length ? (qs.reduce((n, q) => n + (WEIGHT[q.difficulty] ?? 10), 0) / qs.length).toFixed(1) : '–')
const longest = (q) => {
  const lens = q.options.map((o) => o.length)
  return lens.every((l, i) => i === q.correct_index || l < lens[q.correct_index])
}
const skillName = new Map((c.skills ?? []).map((s) => [s.id, s.name]))
const modules = c.modules ?? []
const finalQs = c.final?.questions ?? []

const lines = []
const say = (s = '') => lines.push(s)
say(`# Assessment tables: ${file.split(/[\\/]/).pop()}`)
say()
say(`*Written by \`node agents/blueprint.mjs\` on ${new Date().toISOString().slice(0, 10)}. Don't edit by hand; run it again after any change.*`)
say()

say('## What each test holds')
say('| Part | Questions | Marks | Difficulty (B / I / A / E) | Average difficulty | Right answer longest |')
say('| --- | --- | --- | --- | --- | --- |')
for (const m of modules) {
  const qs = m.quiz ?? []
  say(`| ${cell(m.id)} ${cell(m.title)} | ${qs.length} | ${qs.reduce((n, q) => n + marks(q), 0)} | ${mix(qs)} | ${mean(qs)} | ${qs.filter(longest).length} |`)
}
say(`| **Final** (${c.final?.minutes ?? '?'} min, pass ${c.final?.pass_percent ?? 60}%) | ${finalQs.length} | ${finalQs.reduce((n, q) => n + marks(q), 0)} | ${mix(finalQs)} | ${mean(finalQs)} | ${finalQs.filter(longest).length} |`)
const all = allQuestions(c)
say(`| **All** | ${all.length} | ${all.reduce((n, q) => n + marks(q), 0)} | ${mix(all)} | ${mean(all)} | ${all.filter(longest).length} (${all.length ? Math.round((100 * all.filter(longest).length) / all.length) : 0}%; chance is about 25%) |`)
say()

say('## Skills: self-check, teaching and tests')
say('| Skill | Self-check statements (reversed) | Modules | Quiz questions | Learn cards |')
say('| --- | --- | --- | --- | --- |')
for (const s of c.skills ?? []) {
  const items = (c.aptitude?.items ?? []).filter((i) => i.skill === s.id)
  const ms = modules.filter((m) => m.skill === s.id)
  say(`| ${cell(s.name)} | ${items.length} (${items.filter((i) => i.reverse).length}) | ${ms.map((m) => m.id).join(', ') || '**none**'} | ${ms.reduce((n, m) => n + (m.quiz?.length ?? 0), 0)} | ${ms.reduce((n, m) => n + (m.learn?.length ?? 0), 0)} |`)
}
say()
say('The final\'s questions carry no skill in the file: the Assessment Architect maps them in the blueprint.')
say()

say('## Question map')
say('| Id | Part | Skill | Module level | Difficulty | Marks | Topic | Key | Longest? | What it teaches |')
say('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |')
for (const m of modules)
  for (const q of m.quiz ?? [])
    say(`| ${cell(q.id)} | ${cell(m.id)} | ${cell(skillName.get(m.skill) ?? m.skill)} | ${cell(m.level)} | ${cell(q.difficulty)} | ${marks(q)} | ${cell(q.topic)} | ${'ABCDEF'[q.correct_index] ?? '?'} | ${longest(q) ? 'yes' : ''} | ${cell(q.learning_outcome)} |`)
for (const q of finalQs)
  say(`| ${cell(q.id)} | final | | | ${cell(q.difficulty)} | ${marks(q)} | ${cell(q.topic)} | ${'ABCDEF'[q.correct_index] ?? '?'} | ${longest(q) ? 'yes' : ''} | ${cell(q.learning_outcome)} |`)
say()

say('## Answer keys')
for (const m of modules) say(`- ${m.id}: ${(m.quiz ?? []).map((q) => 'ABCDEF'[q.correct_index] ?? '?').join('')}`)
say(`- final: ${finalQs.map((q) => 'ABCDEF'[q.correct_index] ?? '?').join('')}`)
say()

say('## Project rubric (as stored)')
for (const r of c.project?.rubric ?? []) say(`- **${cell(r.name)}** (\`${cell(r.id)}\`): ${cell(r.description)}`)
if (!(c.project?.rubric ?? []).length) say('- none yet')

fs.writeFileSync(out, lines.join('\n') + '\n')
console.log(out)
