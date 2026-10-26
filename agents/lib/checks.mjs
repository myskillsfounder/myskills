// The checks run on every draft before and after each review round:
// publishProblems() is the database's own publish check (keep it in step with
// programme_content_problems() in scripts/builtin-programmes.template.sql);
// qualityFindings() are the test-writing checks a script can do better than
// a reader: they go to the Assessment Agent and the Course Architect as
// findings, so the same mistakes are fixed every time.
import { allQuestions, answerPattern, moduleMinutes, sameStructure } from './content.mjs'

const blank = (s) => !s || !String(s).trim()

function questionProblems(q, where) {
  const v = []
  if (blank(q.id)) v.push(`${where}: a question has no id`)
  if (blank(q.question)) v.push(`${where}: a question has no text`)
  if (!Array.isArray(q.options)) return [...v, `${where}: a question has no options`]
  if (q.options.length < 2 || q.options.length > 6) v.push(`${where}: a question needs 2 to 6 options`)
  if (q.options.some(blank)) v.push(`${where}: an option is empty`)
  if (!(Number.isInteger(q.correct_index) && q.correct_index >= 0 && q.correct_index < q.options.length)) v.push(`${where}: a question has no correct answer marked`)
  if (blank(q.explanation)) v.push(`${where}: a question has no explanation`)
  return v
}

/** What stops Publish, worded as the editor words it. `builtIn`: Global
 *  Leadership or Digital Marketing, which the Foundation rule skips. */
export function publishProblems(p, builtIn = false) {
  const v = []
  if (blank(p.overview?.summary)) v.push('Overview: write a summary')
  if (!(p.overview?.outcomes ?? []).length) v.push('Overview: add at least one outcome')
  const skills = (p.skills ?? []).map((s) => s.id)
  if (!skills.length) v.push('Skills: add at least one skill')
  if ((p.skills ?? []).some((s) => blank(s.id) || blank(s.name))) v.push('Skills: every skill needs a name')
  if (new Set(skills).size !== skills.length) v.push('Skills: two skills share an id')
  const items = p.aptitude?.items ?? []
  for (const s of skills) {
    if (items.filter((i) => i.skill === s && !blank(i.statement)).length < 2) v.push(`Aptitude: skill "${s}" needs at least 2 statements`)
  }
  if (items.some((i) => !skills.includes(i.skill))) v.push('Aptitude: a statement belongs to a skill that does not exist')
  if (!(p.modules ?? []).length) v.push('Modules: add at least one module')
  const ids = []
  for (const m of p.modules ?? []) {
    const where = `Module "${m.title || m.id || '?'}"`
    const tasks = m.tasks?.length ?? 0
    const quiz = m.quiz?.length ?? 0
    if (blank(m.id) || blank(m.title)) v.push(`${where}: needs an id and a title`)
    if (!skills.includes(m.skill)) v.push(`${where}: pick the skill it trains`)
    if (!tasks && !quiz) v.push(`${where}: add Practise tasks, a quiz, or both`)
    if (tasks && blank(m.reflection?.prompt)) v.push(`${where}: write the Reflect prompt`)
    if ((m.tasks ?? []).some((t) => blank(t.prompt))) v.push(`${where}: a Practise task has no instructions`)
    if (quiz >= 1 && quiz <= 2) v.push(`${where}: a quiz needs at least 3 questions`)
    for (const q of m.quiz ?? []) {
      v.push(...questionProblems(q, `${where} quiz`))
      ids.push(q.id ?? '')
    }
    ids.push(m.id ?? '')
  }
  const final = p.final?.questions ?? []
  if (final.length >= 1 && final.length <= 4) v.push('Final assessment: add at least 5 questions, or none')
  for (const q of final) {
    v.push(...questionProblems(q, 'Final assessment'))
    ids.push(q.id ?? '')
  }
  // The Foundation assessment (programme_foundation_problems in
  // docs/supabase-foundation-certificates.sql): every question's skill must
  // exist, and each skill a foundation module trains (every module's, when none
  // is marked foundation) needs 2+ final questions tagged with it.
  if (final.some((q) => !blank(q.skill) && !skills.includes(q.skill))) v.push('Foundation assessment: a question names a skill that does not exist')
  if (!builtIn) {
    const mods = p.modules ?? []
    const base = mods.some((m) => m.level === 'foundation') ? mods.filter((m) => m.level === 'foundation') : mods
    for (const s of new Set(base.map((m) => m.skill).filter((x) => !blank(x)))) {
      if (final.filter((q) => q.skill === s).length < 2) v.push(`Foundation assessment: skill "${s}" needs at least 2 questions`)
    }
  }
  if (new Set(ids).size !== ids.length) v.push('Two modules or questions share an id')
  if (blank(p.project?.brief)) v.push('Project: write the brief')
  if (!(p.project?.rubric ?? []).length) v.push('Project: the rubric needs at least one criterion')
  return [...new Set(v)]
}

/** Where a question lives, as a review target: "module:<id>" or "final". */
function targetsOf(c) {
  const t = new Map()
  for (const m of c.modules ?? []) for (const q of m.quiz ?? []) t.set(q.id, `module:${m.id}`)
  for (const q of c.final?.questions ?? []) t.set(q.id, 'final')
  return t
}

const finding = (target, severity, problem, fix) => ({ target, severity, problem, fix, source: 'Automatic check' })

/**
 * The test-writing checks. `original` is the programme before this job
 * (for the built-in lock), `locked` true for a built-in programme.
 */
export function qualityFindings(c, { locked = false, original = null } = {}) {
  const out = []
  const where = targetsOf(c)

  for (const p of publishProblems(c, locked)) {
    const m = /^Module "(.+?)"/.exec(p)
    const mod = m && (c.modules ?? []).find((x) => (x.title || x.id) === m[1])
    const target = mod ? `module:${mod.id}` : p.startsWith('Final') || p.startsWith('Foundation') ? 'final' : p.startsWith('Aptitude') ? 'aptitude' : p.startsWith('Skills') ? 'skills' : p.startsWith('Project') ? 'project' : p.startsWith('Overview') ? 'overview' : 'programme'
    out.push(finding(target, 'must_fix', `Publish check: ${p}.`, 'Complete or correct it.'))
  }
  if (locked && original && !sameStructure(c, original)) {
    out.push(finding('programme', 'must_fix', 'The built-in structure changed (modules, tasks, questions, statements or skills were added, removed or reordered).', 'Keep every id, in order; change only wording.'))
  }

  // Per-question checks, gathered per module so each finding names the
  // questions instead of repeating itself.
  const per = new Map()
  const flag = (q, kind, detail = q.id) => {
    const key = `${where.get(q.id)}|${kind}`
    per.set(key, [...(per.get(key) ?? []), detail])
  }

  // The answer-length clue: the right answer longest more often than chance.
  const qs = allQuestions(c).filter((q) => q.options?.length >= 3 && q.correct_index >= 0)
  const longest = []
  for (const q of qs) {
    const lens = q.options.map((o) => o.length)
    const right = lens[q.correct_index]
    const others = lens.filter((_, i) => i !== q.correct_index)
    const avg = others.reduce((a, b) => a + b, 0) / others.length
    if (others.every((l) => l < right) && right > Math.max(...others) * 1.1) longest.push(q)
    if (right > avg * 1.5 && right - avg > 20) flag(q, 'long', `${q.id} (${(right / avg).toFixed(1)}×)`)
  }
  if (qs.length >= 8 && longest.length / qs.length > 0.3) {
    const byTarget = new Map()
    for (const q of longest) byTarget.set(where.get(q.id), [...(byTarget.get(where.get(q.id)) ?? []), q.id])
    for (const [target, ids] of byTarget) {
      out.push(finding(target, 'should_fix', `The right answer is clearly the longest option in ${ids.join(', ')} (across the programme: ${longest.length} of ${qs.length} questions, where chance would be about a quarter).`, 'Lengthen a wrong option or tighten the right one in each, so length gives nothing away.'))
    }
  }

  for (const q of allQuestions(c)) {
    const opts = (q.options ?? []).map((o) => o.trim().toLowerCase())
    if (new Set(opts).size !== opts.length) flag(q, 'same')
    if (opts.some((o) => /\b(all|none|both) of (the )?(above|these)\b/.test(o))) flag(q, 'above')
    if (!locked && q.options?.length && q.options.length !== 4) flag(q, 'count')
    if (blank(q.why_wrong)) flag(q, 'nowhy')
    else if (/^the others?\b/i.test(q.why_wrong.trim())) flag(q, 'others')
    if (blank(q.learning_outcome)) flag(q, 'nooutcome')
    if (blank(q.topic)) flag(q, 'notopic')
  }
  const KINDS = {
    long: ['must_fix', 'The right answer is much longer than the other options, which gives it away, in', 'Make the wrong options as long and detailed as the right one (real mistakes learners make), or tighten the right answer.'],
    same: ['must_fix', 'Two options are the same in', 'Make every option different.'],
    above: ['must_fix', '“All/none of the above” is used in', 'Replace it with a real option.'],
    count: ['should_fix', 'These questions don’t have 4 options (MySkills questions do):', 'Use four options.'],
    nowhy: ['should_fix', 'No “why the others are wrong” in', 'Say briefly why each wrong option is wrong.'],
    others: ['should_fix', '“Why the others are wrong” starts with “The other(s)”, which the page already says, in', 'Start with the reason itself.'],
    nooutcome: ['should_fix', 'No “what it teaches” line in', 'Add one line each.'],
    notopic: ['should_fix', 'No topic (Question health and the Learner Coach group by it) in', 'Add a short topic to each.'],
  }
  for (const [key, ids] of per) {
    const [target, kind] = key.split('|')
    const [severity, problem, fix] = KINDS[kind]
    out.push(finding(target, severity, `${problem} ${ids.join(', ')}.`, fix))
  }

  // Time: the overview's hours should cover the modules, and modules with
  // hands-on tasks need time for them.
  const mins = moduleMinutes(c)
  const hours = c.overview?.hours ?? 0
  if ((c.modules ?? []).length && (hours < Math.round(mins / 60) || hours > Math.round(mins / 60) + 60)) {
    out.push(finding('overview', 'should_fix', `The overview says ${hours} hours, but the modules add up to ${(mins / 60).toFixed(1)} hours (plus the project).`, 'Make the hours the module time plus the project and final test.'))
  }
  for (const m of c.modules ?? []) {
    if ((m.tasks?.length ?? 0) >= 2 && m.minutes < 45) out.push(finding(`module:${m.id}`, 'should_fix', `“${m.title}” has ${m.tasks.length} hands-on tasks in ${m.minutes} minutes.`, 'Give it a realistic time.'))
    for (const l of m.learn ?? []) {
      const words = String(l.body ?? '').split(/\s+/).filter(Boolean).length
      if (words < 30) out.push(finding(`module:${m.id}`, 'should_fix', `The Learn card “${l.title}” in “${m.title}” is only ${words} words.`, 'Explain it properly, with an example.'))
    }
  }

  if (!locked) {
    const items = c.aptitude?.items ?? []
    for (const s of c.skills ?? []) {
      const mine = items.filter((i) => i.skill === s.id)
      if (mine.length >= 2 && mine.length < 3) out.push(finding('aptitude', 'should_fix', `Skill “${s.name}” has only ${mine.length} aptitude statements.`, 'Give each skill three.'))
      if (mine.length >= 2 && !mine.some((i) => i.reverse)) out.push(finding('aptitude', 'should_fix', `Skill “${s.name}” has no reversed statement, so agreeing with everything scores high.`, 'Make one of its statements reversed.'))
      if (!(c.modules ?? []).some((m) => m.skill === s.id)) out.push(finding('skills', 'should_fix', `No module trains “${s.name}”.`, 'Train it in a module, or drop the skill.'))
    }
    const pattern = answerPattern(c)
    if (pattern) out.push(finding('programme', 'must_fix', `Learners could guess the right answers by position: ${pattern}.`, 'Run check.mjs with --tidy: the system gives the right answers new, unpatterned places.'))
    const diff = new Set(allQuestions(c).map((q) => q.difficulty))
    if (allQuestions(c).length >= 20 && !diff.has('Advanced') && !diff.has('Expert')) {
      out.push(finding('programme', 'should_fix', 'No question is Advanced or harder.', 'Make some later-module and final questions Advanced.'))
    }
  }
  return out
}

/** The numbers for the report. */
export function stats(c, { locked = false } = {}) {
  const qs = allQuestions(c).filter((q) => q.correct_index >= 0)
  let longest = 0
  for (const q of qs) {
    const lens = q.options.map((o) => o.length)
    const right = lens[q.correct_index]
    if (lens.every((l, i) => i === q.correct_index || l < right)) longest++
  }
  const pos = [0, 0, 0, 0]
  for (const q of qs) if (q.correct_index < 4) pos[q.correct_index]++
  const difficulty = {}
  for (const q of qs) difficulty[q.difficulty] = (difficulty[q.difficulty] ?? 0) + 1
  return {
    skills: c.skills?.length ?? 0,
    statements: c.aptitude?.items?.length ?? 0,
    modules: c.modules?.length ?? 0,
    tasks: (c.modules ?? []).reduce((n, m) => n + (m.tasks?.length ?? 0), 0),
    questions: qs.length,
    finalQuestions: c.final?.questions?.length ?? 0,
    rightIsLongest: longest,
    positions: pos,
    difficulty,
    moduleHours: Math.round((moduleMinutes(c) / 60) * 10) / 10,
    hours: c.overview?.hours ?? 0,
    publishProblems: publishProblems(c, locked).length,
  }
}
