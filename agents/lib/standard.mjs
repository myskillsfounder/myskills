// The Module Standard (agents/module-standard.md): what a script can measure
// of it, and the module scores from a review. check.mjs and the scorecard use
// these; the server's pipeline doesn't yet (step 5 of docs/course-team-plan.md).
import { allQuestions } from './content.mjs'

/** The eight dimensions, in the standard's order. */
export const DIMENSIONS = ['outcome', 'explanation', 'practice', 'feedback', 'relevance', 'time', 'progression', 'inclusion']

/** A module is ready when every dimension scores at least this. */
export const READY_SCORE = 4

// How long the work in a module takes a learner reading English as a second
// language on a phone.
export const PACE = { wordsPerMinute: 120, perTask: 20, reflection: 5, perQuestion: 1.5 }

const words = (s) => String(s ?? '').split(/\s+/).filter(Boolean).length
const sentences = (s) =>
  String(s ?? '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((x) => x.trim())
    .filter((x) => words(x) >= 3)

/** The minutes a module's content takes, from the standard's pace. */
export function moduleEstimate(m) {
  const reading = (m.learn ?? []).reduce((n, l) => n + words(l.title) + words(l.body), 0) + (m.tasks ?? []).reduce((n, t) => n + words(t.prompt) + words(t.hint), 0)
  return Math.round(reading / PACE.wordsPerMinute + (m.tasks?.length ?? 0) * PACE.perTask + (m.reflection?.prompt ? PACE.reflection : 0) + (m.quiz?.length ?? 0) * PACE.perQuestion)
}

// A worked example: the card shows a case, not just a definition. Code,
// formulas and a worked line of figures count.
const EXAMPLE = /\b(for example|for instance|e\.g\.|example|imagine|suppose|say you|let's say|take [A-Z][a-z]+|worked)\b|₹\s?\d/i
const WORKED = /\n\s*(SELECT|FROM|WITH|=|df[.[]|import |pd\.|[A-Za-z_]+\(.*\)\s*$)|=[A-Z]+\(/m
const hasExample = (s) => EXAMPLE.test(s) || WORKED.test(s)

// Paid tools that need a free alternative named next to them (playbook rule 7).
const PAID = /\b(copilot|power bi pro|chatgpt plus|chatgpt pro|claude pro|gemini advanced|semrush|ahrefs|moz pro|canva pro|tableau(?! public)|hubspot (?:pro|enterprise)|adobe (?:photoshop|illustrator|premiere)|figma professional|notion ai|grammarly premium|jasper)\b/i

const finding = (target, dimension, severity, problem, fix, owner = 'course') => ({ target, severity, problem, fix, source: 'Automatic check (Module Standard)', owner, standard: dimension })

/**
 * The Module Standard's measurable checks. They add to qualityFindings()
 * (agents/lib/checks.mjs), which already checks thin cards (under 30 words),
 * tasks squeezed into under 45 minutes, and the programme's hours.
 */
export function standardFindings(c) {
  const out = []
  for (const m of c.modules ?? []) {
    const target = `module:${m.id}`
    const name = `“${m.title}”`
    const learn = m.learn ?? []

    // outcome
    if (!String(m.outcome ?? '').trim()) out.push(finding(target, 'outcome', 'should_fix', `${name} has no outcome.`, 'Write one outcome that says what the learner will be able to do.'))

    // explanation
    const learnWords = learn.reduce((n, l) => n + words(l.body), 0)
    if (learn.length && learnWords < 250) out.push(finding(target, 'explanation', 'should_fix', `${name} teaches in ${learnWords} words of Learn cards, too little to do its tasks and quiz from.`, 'Add the explanation, worked example and common mistake the tasks need.'))
    if (learn.length && !learn.some((l) => hasExample(l.body ?? ''))) out.push(finding(target, 'explanation', 'should_fix', `No Learn card in ${name} works through an example.`, 'Add a worked example (a real Indian case, worked step by step) before the tasks.'))
    for (const l of learn) {
      const n = words(l.body)
      if (n > 170) out.push(finding(target, 'explanation', 'should_fix', `The Learn card “${l.title}” in ${name} is ${n} words, long for a phone.`, 'Split it into cards of one idea each (about 60 to 150 words).'))
    }

    // inclusion: readable in a second language
    const long = []
    for (const l of learn) {
      const ss = sentences(l.body)
      if (!ss.length) continue
      const avg = ss.reduce((n, s) => n + words(s), 0) / ss.length
      const longest = Math.max(...ss.map(words))
      if (avg > 20 || longest > 35) long.push(`“${l.title}” (${avg.toFixed(0)} words a sentence on average, longest ${longest})`)
    }
    if (long.length) out.push(finding(target, 'inclusion', 'should_fix', `Hard reading for a second-language reader in ${name}: ${long.join('; ')}.`, 'Keep sentences mostly under 20 words; split the long ones.'))
    for (const t of m.tasks ?? []) {
      const text = `${t.prompt ?? ''} ${t.hint ?? ''}`
      if (PAID.test(text) && !/\bfree\b/i.test(text)) out.push(finding(target, 'inclusion', 'should_fix', `Task ${t.id} in ${name} names a paid tool (${text.match(PAID)[0]}) with no free way to do it.`, 'Name a free tool that does the job too (playbook rule 7).'))
    }

    // time: the minutes against the work
    const est = moduleEstimate(m)
    if (m.minutes && est && m.minutes < est * 0.7) out.push(finding(target, 'time', 'should_fix', `${name} gives ${m.minutes} minutes for about ${est} minutes of work (reading, ${m.tasks?.length ?? 0} tasks, reflection, quiz).`, `Set it to about ${est} minutes, or cut the work.`))
    else if (m.minutes && est && m.minutes > est * 2.5 && m.minutes - est > 30) out.push(finding(target, 'time', 'should_fix', `${name} says ${m.minutes} minutes, but its content takes about ${est}.`, 'Add the teaching and practice that time promises, or lower the minutes.'))
  }

  // feedback: the explanations that make every answer teach (the Assessment
  // Architect's part; qualityFindings() already flags a missing why_wrong).
  const thin = allQuestions(c).filter((q) => q.explanation && words(q.explanation) < 12)
  if (thin.length) out.push(finding('programme', 'feedback', 'should_fix', `These explanations are too short to teach the reasoning: ${thin.map((q) => q.id).join(', ')}.`, 'Say why the right answer is right, in one or two sentences.', 'assessment'))
  return out
}

/** Every web address in the programme, with where it is. */
export function linksIn(c) {
  const found = new Map()
  const walk = (v, where) => {
    if (typeof v === 'string') for (const u of v.match(/https?:\/\/[^\s)<>"'\]]+/g) ?? []) found.set(u.replace(/[.,;:]+$/, ''), where)
    else if (Array.isArray(v)) v.forEach((x) => walk(x, where))
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, where)
  }
  walk(c.overview, 'overview')
  for (const m of c.modules ?? []) walk(m, `module:${m.id}`)
  walk(c.final, 'final')
  walk(c.project, 'project')
  return found
}

/** Opens every link; a page that doesn't load is a finding. Uses the network. */
export async function linkFindings(c, { timeoutMs = 15000 } = {}) {
  const out = []
  for (const [url, target] of linksIn(c)) {
    let status = null
    try {
      const go = (method) => fetch(url, { method, redirect: 'follow', signal: AbortSignal.timeout(timeoutMs), headers: { 'user-agent': 'Mozilla/5.0 (MySkills course check)' } })
      let r = await go('HEAD')
      if (r.status >= 400) r = await go('GET')
      status = r.status
    } catch (e) {
      status = e.name === 'TimeoutError' ? 'timed out' : 'did not load'
    }
    // 401/403/429 usually mean the site blocks scripts, not that the page is gone.
    if (typeof status === 'string' || (status >= 400 && ![401, 403, 429].includes(status))) {
      out.push(finding(target, 'relevance', 'should_fix', `The link ${url} ${typeof status === 'string' ? status : `returned ${status}`}.`, 'Replace it with a working page from the same publisher, or remove it.'))
    }
  }
  return out
}

/**
 * The review's module scores, summarised: the lowest score, how many module
 * dimensions are below the bar, and the mean per dimension.
 * `review.module_scores` is [{ module, scores: { <dimension>: 1-5 }, notes,
 * held_by_structure, not_in_file }]: a built-in programme's dimensions that its
 * locked structure holds down, or that its file doesn't show (its teaching is
 * on its own pages), don't count against the bar.
 */
export function moduleScoreSummary(review, content = null) {
  const rows = review?.module_scores ?? []
  if (!rows.length) return null
  const expected = content ? (content.modules ?? []).map((m) => m.id) : rows.map((r) => r.module)
  const missing = expected.filter((id) => !rows.some((r) => r.module === id))
  const below = []
  const sum = {}
  const n = {}
  let min = 5
  for (const r of rows) {
    for (const d of DIMENSIONS) {
      if ((r.not_in_file ?? []).includes(d)) continue
      const s = r.scores?.[d]
      if (!Number.isFinite(s)) {
        below.push(`${r.module}: ${d} not scored`)
        continue
      }
      sum[d] = (sum[d] ?? 0) + s
      n[d] = (n[d] ?? 0) + 1
      min = Math.min(min, s)
      if (s < READY_SCORE && !(r.held_by_structure ?? []).includes(d)) below.push(`${r.module}: ${d} ${s}`)
    }
  }
  const mean = Object.fromEntries(DIMENSIONS.filter((d) => n[d]).map((d) => [d, Math.round((sum[d] / n[d]) * 10) / 10]))
  const all = Object.values(sum).reduce((a, b) => a + b, 0) / Object.values(n).reduce((a, b) => a + b, 0)
  return {
    modules: rows.length,
    missing,
    min,
    mean: Math.round(all * 10) / 10,
    byDimension: mean,
    belowBar: below,
    meetsBar: !missing.length && !below.length,
  }
}
