// Clue tests: a cheap model (the question-prober subagent, Haiku) takes the
// programme's questions the way a student who hasn't mastered the topic would,
// from a packet with no answers in it. What it gets right or wrong shows
// problems a careful writer misses:
//
//   options   only the four options, no scenario or question. The prober knows
//             the subject, so this measures whether the scenario decides the
//             answer: a question it gets right from the options alone tests
//             knowing good practice, not applying it to the case. Some code
//             and fact questions are fine that way; most should not be.
//   cards     a module's Learn cards, then its quiz. A miss may mean the
//             module doesn't teach what the question tests.
//   blind     every question in full, no answer key. A pick that differs from
//             the key may mean a second defensible answer, or a wrong key.
//
//   node agents/probe.mjs make  <file> --mode options|cards|blind --out <dir>
//        writes <dir>/<name>.probe-<mode>.packet.json (no answers in it)
//   node agents/probe.mjs score <file> --mode options|cards|blind --answers <answers.json>
//        adds the results to <file without .json>.probes.json and prints them
//
// Options are shuffled in the packet (seeded, so make and score agree), so a
// habit of picking a position can't look like a clue.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { seededRandom } from './lib/content.mjs'

const MODES = ['options', 'cards', 'blind']

/** The order the options are shown in the packet: packet position -> original index. */
export function shownOrder(q, mode) {
  const order = q.options.map((_, i) => i)
  const random = seededRandom(`${mode}|${q.id}`)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

const shown = (q, mode) => shownOrder(q, mode).map((i) => q.options[i])
const stem = (q) => ({
  id: q.id,
  ...(q.title ? { title: q.title } : {}),
  ...(q.scenario ? { scenario: q.scenario } : {}),
  ...(q.context && Object.keys(q.context).length ? { context: q.context } : {}),
  question: q.question,
})

const INSTRUCTIONS = {
  options:
    'Each item shows only the four answer options of a multiple-choice question; the question itself is hidden. For each item, pick the option most likely to be the right answer, judging only from the options themselves. Never skip an item.',
  cards:
    'Each module has its Learn cards, then its quiz. Answer each question using only what that module\'s cards (and common sense) teach. If the cards don\'t cover what a question needs, still pick your best guess, and set "taught" to false.',
  blind:
    'Answer each question as an expert in the field would. If more than one option could be defended as right, still pick the best one, and name the other in "also".',
}

/** The packet for one mode: everything the prober may see, and nothing else. */
export function packet(c, mode) {
  const quizzes = (c.modules ?? []).filter((m) => (m.quiz ?? []).length)
  const base = { mode, instructions: INSTRUCTIONS[mode], answer_format: answerFormat(mode) }
  if (mode === 'options')
    return { ...base, items: [...quizzes.flatMap((m) => m.quiz), ...(c.final?.questions ?? [])].map((q) => ({ id: q.id, options: shown(q, mode) })) }
  if (mode === 'cards')
    return {
      ...base,
      modules: quizzes.map((m) => ({
        id: m.id,
        title: m.title,
        learn: (m.learn ?? []).map((l) => ({ title: l.title, body: l.body })),
        questions: m.quiz.map((q) => ({ ...stem(q), options: shown(q, mode) })),
      })),
    }
  return { ...base, items: [...quizzes.flatMap((m) => m.quiz), ...(c.final?.questions ?? [])].map((q) => ({ ...stem(q), options: shown(q, mode) })) }
}

function answerFormat(mode) {
  const extra = mode === 'cards' ? ', "taught": true|false' : mode === 'blind' ? ', "also": null|<0-3>' : ''
  return `A JSON object keyed by question id: { "<id>": { "pick": <0-3, the option's position in this packet>, "sure": 1|2|3${extra} } }, where sure is 1 = a guess, 2 = fairly sure, 3 = certain.`
}

// P(X >= k) for X ~ Binomial(n, p): how likely this many right answers are by chance.
function atLeast(k, n, p) {
  let sum = 0
  let term = Math.pow(1 - p, n)
  for (let i = 0; i <= n; i++) {
    if (i >= k) sum += term
    term *= ((n - i) / (i + 1)) * (p / (1 - p))
  }
  return Math.min(1, sum)
}

/** Score a prober's answers against the key. Returns the results and findings in the review's shape. */
export function score(c, mode, answers) {
  const where = new Map()
  for (const m of c.modules ?? []) for (const q of m.quiz ?? []) where.set(q.id, `module:${m.id}`)
  for (const q of c.final?.questions ?? []) where.set(q.id, 'final')
  const asked = mode === 'cards' ? (c.modules ?? []).flatMap((m) => m.quiz ?? []) : [...(c.modules ?? []).flatMap((m) => m.quiz ?? []), ...(c.final?.questions ?? [])]
  const rows = []
  for (const q of asked) {
    const a = answers[q.id]
    if (!a || !Number.isInteger(a.pick) || a.pick < 0 || a.pick >= q.options.length) {
      rows.push({ id: q.id, answered: false })
      continue
    }
    const order = shownOrder(q, mode)
    const picked = order[a.pick]
    const also = Number.isInteger(a.also) && a.also >= 0 && a.also < q.options.length ? order[a.also] : null
    rows.push({ id: q.id, answered: true, right: picked === q.correct_index, picked, sure: a.sure ?? null, taught: a.taught ?? null, also: also === picked ? null : also })
  }
  const done = rows.filter((r) => r.answered)
  const right = done.filter((r) => r.right).length
  const findings = []
  const add = (target, severity, problem, fix) => findings.push({ target, severity, problem, fix, source: `Clue test (${mode})`, owner: 'assessment', category: 'clue-test' })
  const optionText = (id, i) => `“${c.modules.flatMap((m) => m.quiz ?? []).concat(c.final?.questions ?? []).find((q) => q.id === id).options[i]}”`

  let summary
  if (mode === 'options') {
    const p = atLeast(right, done.length, 0.25)
    summary = `Picked the right answer from the options alone in ${right} of ${done.length} questions (${pct(right, done.length)}; chance is 25%, and a result this high by chance has probability ${p.toFixed(3)}).`
    const sure = done.filter((r) => r.right && r.sure === 3)
    if (p < 0.05 && right / done.length > 0.5)
      add('programme', 'must_fix', `The scenarios rarely decide the answer: ${summary} A learner who knows the textbook practice can pass without applying it to the case.`, 'Rewrite judgement questions so the scenario’s facts decide: make each wrong option what would be right in a different, plausible situation (another goal, data shape, audience or constraint), so only the facts given make one option the best. Aim for no more than half answerable from the options alone.')
    for (const [target, ids] of group(sure.map((r) => r.id), where))
      add(target, 'should_fix', `Without seeing the question, the clue test was certain of the right answer in ${ids.join(', ')}.`, 'Check what makes the right option stand out. If a wrong option is careless or marks itself out, give it the same quality as the right one. If the right one is simply always good practice, make the scenario decide (see the programme-level finding), unless it is a code or fact question that rightly tests knowing it.')
  } else if (mode === 'cards') {
    summary = `Answered ${right} of ${done.length} module questions right from the Learn cards alone (${pct(right, done.length)}).`
    const gaps = done.filter((r) => !r.right || r.taught === false)
    for (const [target, ids] of group(gaps.map((r) => r.id), where))
      add(target, 'should_fix', `Using only the module's Learn cards, the clue test missed or found untaught: ${ids.join(', ')}.`, 'Check each against the cards. If the cards don\'t teach what it needs, tell the Course Architect what to add (owner "course"); if they do, make the question clearer.')
  } else {
    summary = `Agreed with the key in ${right} of ${done.length} questions (${pct(right, done.length)}).`
    for (const r of done.filter((r) => !r.right))
      add(where.get(r.id) ?? 'programme', 'must_fix', `${r.id}: answering in full without the key, the clue test chose ${optionText(r.id, r.picked)}, not the keyed answer.`, 'Check the key. If the chosen option can be defended, rewrite the question so only one answer can be; if the key is right, make the deciding fact clearer in the scenario.')
    for (const r of done.filter((r) => r.right && r.also !== null))
      add(where.get(r.id) ?? 'programme', 'should_fix', `${r.id}: the clue test found ${optionText(r.id, r.also)} defensible too.`, 'Make that option clearly wrong, for a reason the explanation can state.')
  }
  const missing = rows.filter((r) => !r.answered).map((r) => r.id)
  if (missing.length) summary += ` Not answered: ${missing.join(', ')}.`
  return { mode, date: new Date().toISOString().slice(0, 10), asked: rows.length, answered: done.length, right, summary, findings, rows }
}

const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : '–')
function group(ids, where) {
  const m = new Map()
  for (const id of ids) m.set(where.get(id) ?? 'programme', [...(m.get(where.get(id) ?? 'programme') ?? []), id])
  return m
}

/* ------------------------------------------------------------- the command */

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, file, ...rest] = process.argv.slice(2)
  const arg = (name) => {
    const i = rest.indexOf(`--${name}`)
    return i >= 0 ? rest[i + 1] : undefined
  }
  const mode = arg('mode')
  if (!['make', 'score'].includes(cmd) || !file || !MODES.includes(mode)) {
    console.error('Usage: node agents/probe.mjs make <file> --mode options|cards|blind --out <dir>\n       node agents/probe.mjs score <file> --mode options|cards|blind --answers <answers.json>')
    process.exit(1)
  }
  const c = JSON.parse(fs.readFileSync(file, 'utf8'))
  const name = path.basename(file).replace(/\.json$/, '')
  if (cmd === 'make') {
    const dir = arg('out')
    if (!dir) {
      console.error('--out <dir> is required: a folder outside the repository, so the prober can only see the packet.')
      process.exit(1)
    }
    fs.mkdirSync(dir, { recursive: true })
    const out = path.join(dir, `${name}.probe-${mode}.packet.json`)
    fs.writeFileSync(out, JSON.stringify(packet(c, mode), null, 1) + '\n')
    console.log(out)
  } else {
    const answers = JSON.parse(fs.readFileSync(arg('answers'), 'utf8'))
    const result = score(c, mode, answers)
    const store = file.replace(/\.json$/, '') + '.probes.json'
    const all = fs.existsSync(store) ? JSON.parse(fs.readFileSync(store, 'utf8')) : {}
    all[mode] = result
    fs.writeFileSync(store, JSON.stringify(all, null, 1) + '\n')
    console.log(JSON.stringify({ store, summary: result.summary, findings: result.findings.map((f) => `[${f.severity}] ${f.target}: ${f.problem}`) }, null, 1))
  }
}
