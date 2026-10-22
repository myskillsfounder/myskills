// The course team's scorecard: the same numbers for a programme every time
// it is drafted, reviewed or revised, so we can see whether it is getting
// better, and whether the agents are getting better at writing programmes.
//
// Three kinds of evidence, each optional except the first:
//   the file itself    the automatic checks (agents/lib/checks.mjs)
//   a review           the Assessment Agent's findings, tagged by category and
//                      by the playbook rule they break
//   learners           Admin → Question health → "Download for the course team":
//                      how students answer each question (no names)
import { qualityFindings, publishProblems, stats } from './checks.mjs'
import { allQuestions } from './content.mjs'

/** Review finding categories (the Assessment Agent tags each finding with one). */
export const CATEGORIES = ['accuracy', 'question-design', 'teaching', 'coverage', 'aptitude', 'project', 'time', 'house-style']

/** Below this many first-time answers, a question's numbers are noise (as on the Question health page). */
export const MIN_ANSWERS = 30

const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : null)
const blank = (s) => !s || !String(s).trim()

/** The question-health flags, as src/lib/questionHealth.ts flagsFor() sets them. */
export function learnerFlags(q) {
  if (q.answered < MIN_ANSWERS || q.correct_pct === null || q.correct_index === null) return []
  const out = []
  const counts = q.option_counts ?? []
  if (q.separation !== null && q.separation < 0) out.push('reversed')
  const right = counts[q.correct_index] ?? 0
  if (counts.some((n, i) => i !== q.correct_index && n > right)) out.push('check-key')
  if (q.separation !== null && q.separation >= 0 && q.separation < 10) out.push('no-separation')
  if (q.correct_pct <= 25) out.push('too-hard')
  if (q.correct_pct >= 90) out.push('too-easy')
  const total = counts.reduce((a, b) => a + b, 0)
  const n = q.options?.length ?? 4
  if (total > 0 && counts.slice(0, n).some((c, i) => i !== q.correct_index && c / total < 0.05)) out.push('unused-option')
  return out
}

/** How students answer this programme's questions (only the questions in the file count). */
export function learnerScore(content, learners) {
  const ids = new Set(allQuestions(content).map((q) => q.id))
  const rows = (learners?.questions ?? []).filter((q) => ids.has(q.question_id))
  const judged = rows.filter((q) => q.answered >= MIN_ANSWERS && q.correct_pct !== null)
  const flags = {}
  let healthy = 0
  for (const q of judged) {
    const f = learnerFlags(q)
    for (const k of f) flags[k] = (flags[k] ?? 0) + 1
    if (!f.length) healthy++
  }
  const seps = judged.map((q) => q.separation).filter((s) => s !== null)
  return {
    since: learners?.since ?? null,
    downloaded: learners?.downloaded_at ?? null,
    matched: rows.length,
    judged: judged.length,
    healthyPct: pct(healthy, judged.length),
    meanSeparation: seps.length ? Math.round((seps.reduce((a, b) => a + b, 0) / seps.length) * 10) / 10 : null,
    meanCorrectPct: judged.length ? Math.round((judged.reduce((a, q) => a + Number(q.correct_pct), 0) / judged.length) * 10) / 10 : null,
    flags,
  }
}

/** What the review found, counted by severity, owner, category and playbook rule. */
export function reviewScore(review) {
  if (!review) return null
  const f = review.findings ?? []
  const count = (pred) => f.filter(pred).length
  const by = (key) => {
    const o = {}
    for (const x of f) if (x.severity !== 'idea') o[x[key] ?? 'untagged'] = (o[x[key] ?? 'untagged'] ?? 0) + 1
    return o
  }
  const rules = {}
  for (const x of f) {
    if (x.severity === 'idea') continue
    for (const r of [].concat(x.rule ?? [])) if (Number.isInteger(r)) rules[r] = (rules[r] ?? 0) + 1
  }
  return {
    verdict: review.verdict ?? null,
    must: count((x) => x.severity === 'must_fix'),
    should: count((x) => x.severity === 'should_fix'),
    ideas: count((x) => x.severity === 'idea'),
    byOwner: by('owner'),
    byCategory: by('category'),
    rulesBroken: rules,
    lessons: (review.lessons ?? []).length,
  }
}

/**
 * The scorecard row for a programme now. `locked` for a built-in programme.
 * Lower is better for the problem counts and the giveaway rate; higher for
 * completeness and the learner numbers.
 */
export function scoreProgramme(content, { locked = false, review = null, learners = null } = {}) {
  const s = stats(content)
  const auto = qualityFindings(content, { locked })
  const qs = allQuestions(content)
  const n = qs.length
  const done = (k) => pct(qs.filter((q) => !blank(q[k])).length, n)
  const rv = reviewScore(review)
  const mustTotal = auto.filter((x) => x.severity === 'must_fix').length + (rv?.must ?? 0)
  const shouldTotal = auto.filter((x) => x.severity === 'should_fix').length + (rv?.should ?? 0)
  return {
    questions: n,
    publishProblems: publishProblems(content).length,
    auto: {
      must: auto.filter((x) => x.severity === 'must_fix').length,
      should: auto.filter((x) => x.severity === 'should_fix').length,
    },
    review: rv,
    // Problems per 10 questions, so programmes of different sizes compare.
    mustPer10: n ? Math.round((mustTotal / n) * 100) / 10 : null,
    shouldPer10: n ? Math.round((shouldTotal / n) * 100) / 10 : null,
    // Chance is about 25%.
    rightIsLongestPct: pct(s.rightIsLongest, s.questions),
    complete: { explanation: done('explanation'), whyWrong: done('why_wrong'), learningOutcome: done('learning_outcome'), topic: done('topic') },
    hours: { advertised: s.hours, modules: s.moduleHours },
    difficulty: s.difficulty,
    learners: learners ? learnerScore(content, learners) : null,
  }
}

/** Short, plain lines saying what moved between two scorecard rows. */
export function compare(prev, now) {
  if (!prev) return ['First row: this is the baseline.']
  const out = []
  const move = (label, a, b, betterIsLower = true, unit = '') => {
    if (a === null || a === undefined || b === null || b === undefined || a === b) return
    const better = betterIsLower ? b < a : b > a
    out.push(`${better ? 'better' : 'worse'}: ${label} ${a}${unit} → ${b}${unit}`)
  }
  // Per-10 counts include the review's findings, so they only compare when
  // both rows had a review; otherwise compare the automatic checks alone.
  if (Boolean(prev.review) === Boolean(now.review)) {
    move('must-fix per 10 questions', prev.mustPer10, now.mustPer10)
    move('should-fix per 10 questions', prev.shouldPer10, now.shouldPer10)
  } else out.push(`not compared: per-10 counts (only one of the two rows has a review)`)
  move('right answer is the longest', prev.rightIsLongestPct, now.rightIsLongestPct, true, '%')
  move('automatic must-fix', prev.auto?.must, now.auto?.must)
  move('automatic should-fix', prev.auto?.should, now.auto?.should)
  move('review must-fix', prev.review?.must, now.review?.must)
  for (const k of ['whyWrong', 'learningOutcome', 'topic']) move(`questions with ${k}`, prev.complete?.[k], now.complete?.[k], false, '%')
  move('healthy questions (students)', prev.learners?.healthyPct, now.learners?.healthyPct, false, '%')
  move('mean separation (students)', prev.learners?.meanSeparation, now.learners?.meanSeparation, false)
  // A rule broken again after a revision means the fix didn't stick.
  for (const [r, c] of Object.entries(now.review?.rulesBroken ?? {})) {
    if (prev.review?.rulesBroken?.[r]) out.push(`still broken: playbook rule ${r} (${prev.review.rulesBroken[r]} → ${c} findings)`)
  }
  return out.length ? out : ['No change in the measured numbers.']
}
