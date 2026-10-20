// Putting programmes together and keeping them consistent: ids, weights,
// where the right answers sit, and the locked structure of the built-in
// programmes. The agents write the words; this file owns everything that
// progress, grading and the database count on.

export const WEIGHT = { Beginner: 5, Intermediate: 10, Advanced: 15, Expert: 20 }

const clean = (s) => (typeof s === 'string' ? s.trim() : '')
const pad = (n) => String(n).padStart(2, '0')

/** "ai-powered-data-analytics" -> "apda": the start of every id in a new programme. */
export function prefixFor(slug) {
  const p = String(slug ?? '')
    .split('-')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 4)
  return /^[a-z]/.test(p) ? p : `p${p}`
}

export const kebab = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

/** The ids, in order, that progress and scores count on (programme_structure() in SQL). */
export function structureOf(c) {
  return {
    skills: (c.skills ?? []).map((s) => s.id),
    aptitude: (c.aptitude?.items ?? []).map((i) => i.id),
    modules: (c.modules ?? []).map((m) => ({ id: m.id, tasks: (m.tasks ?? []).map((t) => t.id), quiz: (m.quiz ?? []).map((q) => q.id) })),
    final: (c.final?.questions ?? []).map((q) => q.id),
  }
}

export const sameStructure = (a, b) => JSON.stringify(structureOf(a)) === JSON.stringify(structureOf(b))

/** Every module and question id in use. */
export function idsIn(c) {
  const ids = new Set()
  for (const m of c.modules ?? []) {
    ids.add(m.id)
    for (const q of m.quiz ?? []) ids.add(q.id)
  }
  for (const q of c.final?.questions ?? []) ids.add(q.id)
  return ids
}

/** A fresh id like base1, base2… not in `used` (and then marked used). */
function freshId(base, used, start = 1) {
  for (let n = start; ; n++) {
    const id = `${base}${n}`
    if (!used.has(id)) {
      used.add(id)
      return id
    }
  }
}

function cleanContext(x) {
  if (!x || typeof x !== 'object') return undefined
  const out = {}
  for (const k of ['company', 'role', 'industry', 'background', 'objective', 'information', 'constraints']) {
    if (clean(x[k])) out[k] = clean(x[k])
  }
  return Object.keys(out).length ? out : undefined
}

/** A question as the engine stores it, with the given id and its weight from its difficulty. */
export function cleanQuestion(q, id) {
  const options = (q.options ?? []).map(clean)
  const difficulty = WEIGHT[q.difficulty] ? q.difficulty : 'Intermediate'
  const context = cleanContext(q.context)
  return {
    id,
    title: clean(q.title),
    scenario: clean(q.scenario),
    ...(context ? { context } : {}),
    question: clean(q.question),
    options,
    correct_index: Number.isInteger(q.correct_index) && q.correct_index >= 0 && q.correct_index < options.length ? q.correct_index : -1,
    explanation: clean(q.explanation),
    ...(clean(q.why_wrong) ? { why_wrong: clean(q.why_wrong) } : {}),
    ...(clean(q.learning_outcome) ? { learning_outcome: clean(q.learning_outcome) } : {}),
    difficulty,
    topic: clean(q.topic),
    weight: WEIGHT[difficulty],
  }
}

const minutesIn = (n, fallback) => (Number.isInteger(n) && n >= 10 && n <= 600 ? n : fallback)

/* ------------------------------------------------------- a new programme */

/** The frame (overview, skills, aptitude, project) with ids made safe. */
export function cleanFrame(f, prefix) {
  const skillIds = new Set()
  const skills = (f.skills ?? []).map((s) => {
    let id = kebab(s.id || s.name) || 'skill'
    while (skillIds.has(id)) id = `${id}-2`
    skillIds.add(id)
    return { id, name: clean(s.name), description: clean(s.description) }
  })
  // The agents name skills by id; match a name too, in case.
  const skillOf = (ref) => {
    const k = kebab(ref)
    return skills.find((s) => s.id === k || kebab(s.name) === k)?.id ?? k
  }
  return {
    overview: {
      summary: clean(f.overview?.summary),
      audience: clean(f.overview?.audience),
      outcomes: (f.overview?.outcomes ?? []).map(clean).filter(Boolean),
      level: ['beginner', 'intermediate', 'advanced'].includes(f.overview?.level) ? f.overview.level : 'beginner',
      hours: Number.isInteger(f.overview?.hours) && f.overview.hours > 0 ? f.overview.hours : 0,
    },
    skills,
    aptitude: {
      items: (f.aptitude ?? []).map((a, i) => ({
        id: `${prefix}-a${pad(i + 1)}`,
        skill: skillOf(a.skill),
        statement: clean(a.statement),
        reverse: Boolean(a.reverse),
      })),
    },
    project: {
      brief: clean(f.project?.brief),
      deliverables: (f.project?.deliverables ?? []).map(clean).filter(Boolean),
      rubric: (f.project?.rubric ?? []).map((r, i) => ({ id: kebab(r.id || r.name) || `criterion-${i + 1}`, name: clean(r.name), description: clean(r.description) })),
    },
  }
}

/** One new module, numbered n, with fresh ids. */
export function cleanNewModule(m, n, prefix, skillOf) {
  const id = `${prefix}-m${pad(n)}`
  return {
    id,
    title: clean(m.title),
    summary: clean(m.summary),
    skill: skillOf(m.skill),
    level: ['foundation', 'intermediate', 'advanced'].includes(m.level) ? m.level : 'intermediate',
    outcome: clean(m.outcome),
    minutes: minutesIn(m.minutes, 90),
    learn: (m.learn ?? []).map((l) => ({ title: clean(l.title), body: clean(l.body) })).filter((l) => l.body),
    tasks: (m.tasks ?? []).map((t, j) => ({ id: `t${j + 1}`, title: clean(t.title), prompt: clean(t.prompt), hint: clean(t.hint) })),
    reflection: { prompt: clean(m.reflection?.prompt), hint: clean(m.reflection?.hint) },
    quiz: (m.quiz ?? []).map((q, j) => cleanQuestion(q, `${id}-q${j + 1}`)),
  }
}

export function assembleDraft({ frame, modules, finalQuestions, prefix }) {
  const skillOf = (ref) => {
    const k = kebab(ref)
    return frame.skills.find((s) => s.id === k || kebab(s.name) === k)?.id ?? k
  }
  return {
    overview: frame.overview,
    skills: frame.skills,
    aptitude: frame.aptitude,
    modules: modules.map((m, i) => cleanNewModule(m, i + 1, prefix, skillOf)),
    final: { minutes: 30, pass_percent: 60, questions: finalQuestions.map((q, i) => cleanQuestion(q, `${prefix}-f${pad(i + 1)}`)) },
    project: frame.project,
  }
}

/* ------------------------------------------------- revising what exists */

/**
 * Put a revised module in place of the original. Locked (built-in): the
 * same tasks and questions in the same order, or the revision is refused.
 * Unlocked: kept ids stay, new items get new ids, nothing collides.
 * Returns { module } or { module: original, refused: reason }.
 */
export function mergeModule(original, revised, { locked, used }) {
  const tasksIn = revised.tasks ?? []
  const quizIn = revised.quiz ?? []
  if (locked) {
    if (tasksIn.length !== original.tasks.length || quizIn.length !== original.quiz.length) {
      return {
        module: original,
        refused: `the revision changed the number of tasks or questions (${original.tasks.length}/${original.quiz.length} → ${tasksIn.length}/${quizIn.length}), which a built-in programme can't`,
      }
    }
    return {
      module: {
        ...original,
        title: clean(revised.title) || original.title,
        summary: clean(revised.summary) || original.summary,
        outcome: clean(revised.outcome) || original.outcome,
        minutes: minutesIn(revised.minutes, original.minutes),
        learn: original.learn?.length ? fitLearn(revised.learn, original.learn.length) ?? original.learn : original.learn,
        tasks: original.tasks.map((t, i) => ({ ...t, title: clean(tasksIn[i].title) || t.title, prompt: clean(tasksIn[i].prompt) || t.prompt, hint: clean(tasksIn[i].hint) })),
        reflection: original.reflection?.prompt ? { prompt: clean(revised.reflection?.prompt) || original.reflection.prompt, hint: clean(revised.reflection?.hint) } : original.reflection,
        quiz: original.quiz.map((q, i) => mergeLockedQuestion(q, quizIn[i])),
      },
    }
  }
  const keepTask = new Set()
  const tasks = tasksIn.map((t) => {
    const ok = original.tasks.some((x) => x.id === t.id) && !keepTask.has(t.id)
    const id = ok ? t.id : null
    if (id) keepTask.add(id)
    return { id, title: clean(t.title), prompt: clean(t.prompt), hint: clean(t.hint) }
  })
  for (const t of tasks) if (!t.id) t.id = freshId('t', keepTask)
  const ownQuiz = new Set(original.quiz.map((q) => q.id))
  const seen = new Set()
  const quiz = quizIn.map((q) => {
    const ok = ownQuiz.has(q.id) && !seen.has(q.id)
    if (ok) seen.add(q.id)
    return { q, id: ok ? q.id : null }
  })
  const out = quiz.map(({ q, id }) => cleanQuestion(q, id ?? freshId(`${original.id}-q`, used, original.quiz.length + 1)))
  return {
    module: {
      ...original,
      title: clean(revised.title) || original.title,
      summary: clean(revised.summary),
      level: ['foundation', 'intermediate', 'advanced'].includes(revised.level) ? revised.level : original.level,
      outcome: clean(revised.outcome) || original.outcome,
      minutes: minutesIn(revised.minutes, original.minutes),
      learn: (revised.learn ?? []).map((l) => ({ title: clean(l.title), body: clean(l.body) })).filter((l) => l.body),
      tasks,
      reflection: { prompt: clean(revised.reflection?.prompt), hint: clean(revised.reflection?.hint) },
      quiz: out,
    },
  }
}

// A built-in question keeps its id and anything the revision left empty; a
// revision without a usable answer is ignored.
function mergeLockedQuestion(q, r) {
  const c = cleanQuestion(r, q.id)
  if (c.correct_index < 0 || c.options.length < 2 || !c.question || !c.explanation) return q
  return { ...q, ...c, title: c.title || q.title || '', scenario: c.scenario || q.scenario || '', context: cleanContext(r.context) ?? q.context }
}

// A built-in module's Learn cards may be reworded but not added or removed.
function fitLearn(learn, n) {
  const l = (learn ?? []).map((x) => ({ title: clean(x.title), body: clean(x.body) }))
  return l.length === n && l.every((x) => x.body) ? l : null
}

/** The revised final questions, under the same rules as a module's quiz. */
export function mergeFinal(original, revised, { locked, used, prefix }) {
  const qs = revised ?? []
  if (locked) {
    if (qs.length !== original.questions.length) {
      return { final: original, refused: `the revision changed the number of final questions (${original.questions.length} → ${qs.length})` }
    }
    return { final: { ...original, questions: original.questions.map((q, i) => mergeLockedQuestion(q, qs[i])) } }
  }
  const own = new Set(original.questions.map((q) => q.id))
  const seen = new Set()
  const questions = qs.map((q) => {
    const keep = own.has(q.id) && !seen.has(q.id)
    if (keep) seen.add(q.id)
    return cleanQuestion(q, keep ? q.id : freshId(`${prefix}-f`, used, original.questions.length + 1))
  })
  return { final: { ...original, questions } }
}

/**
 * The revised frame. Skills and aptitude statements keep their ids; a
 * revision that would leave a module or statement pointing at a skill that
 * no longer exists keeps the original skills. Locked: the same skills and
 * statements in the same order, or only the overview and project change.
 */
export function mergeFrame(content, revised, { locked, prefix }) {
  const notes = []
  const out = { ...content }
  out.overview = cleanFrame({ overview: revised.overview }, prefix).overview
  if (!out.overview.summary) out.overview = content.overview
  const proj = cleanFrame({ project: revised.project }, prefix).project
  if (proj.brief) out.project = proj

  const skillsIn = revised.skills ?? []
  const aptIn = revised.aptitude ?? []
  if (locked) {
    if (skillsIn.length === content.skills.length) {
      out.skills = content.skills.map((s, i) => ({ ...s, name: clean(skillsIn[i].name) || s.name, description: clean(skillsIn[i].description) || s.description }))
    } else notes.push('kept the skills as they were: a built-in programme can’t add or remove skills')
    if (aptIn.length === content.aptitude.items.length) {
      out.aptitude = { items: content.aptitude.items.map((a, i) => ({ ...a, statement: clean(aptIn[i].statement) || a.statement, reverse: Boolean(aptIn[i].reverse) })) }
    } else notes.push('kept the aptitude statements as they were: a built-in programme can’t add or remove them')
    return { content: out, notes }
  }

  const skills = []
  const ids = new Set()
  for (const s of skillsIn) {
    const known = content.skills.find((x) => x.id === s.id)
    let id = known ? known.id : kebab(s.id || s.name) || 'skill'
    while (ids.has(id)) id = `${id}-2`
    ids.add(id)
    skills.push({ id, name: clean(s.name), description: clean(s.description) })
  }
  const orphan = content.modules.find((m) => !ids.has(m.skill))
  if (orphan) {
    notes.push(`kept the skills as they were: the revision dropped “${orphan.skill}”, which the module “${orphan.title}” trains`)
  } else {
    out.skills = skills
  }
  const skillIds = new Set(out.skills.map((s) => s.id))
  const usedA = new Set(content.aptitude.items.map((a) => a.id))
  const seen = new Set()
  const items = aptIn
    .filter((a) => skillIds.has(a.skill))
    .map((a) => {
      const keep = usedA.has(a.id) && !seen.has(a.id)
      if (keep) seen.add(a.id)
      return { id: keep ? a.id : null, skill: a.skill, statement: clean(a.statement), reverse: Boolean(a.reverse) }
    })
  for (const a of items) if (!a.id) a.id = freshId(`${prefix}-a`, usedA, usedA.size + 1)
  if (items.length) out.aptitude = { items }
  return { content: out, notes }
}

/* ----------------------------------------------- where right answers sit */

/** Count of right answers at A, B, C, D… across every question. */
export function positions(c) {
  const n = [0, 0, 0, 0, 0, 0]
  for (const q of allQuestions(c)) if (q.correct_index >= 0) n[q.correct_index]++
  return n
}

export const allQuestions = (c) => [...(c.modules ?? []).flatMap((m) => m.quiz ?? []), ...(c.final?.questions ?? [])]

/**
 * Spread the right answers evenly over the positions when they bunch up
 * (any position over 35% or under 15% of four-option questions). Moves the
 * right option to its new place; the others keep their order. Not for
 * built-in programmes, whose option order the practice pages share.
 */
export function balancePositions(c) {
  const four = allQuestions(c).filter((q) => q.options.length === 4 && q.correct_index >= 0)
  if (four.length < 8) return { content: c, moved: 0 }
  const n = [0, 0, 0, 0]
  for (const q of four) n[q.correct_index]++
  if (n.every((x) => x / four.length <= 0.35 && x / four.length >= 0.15)) return { content: c, moved: 0 }
  const CYCLE = [2, 0, 3, 1]
  let turn = 0
  let moved = 0
  const place = (q) => {
    if (q.options.length !== 4 || q.correct_index < 0) return q
    const target = CYCLE[turn++ % 4]
    if (target === q.correct_index) return q
    const right = q.options[q.correct_index]
    const others = q.options.filter((_, i) => i !== q.correct_index)
    others.splice(target, 0, right)
    moved++
    return { ...q, options: others, correct_index: target }
  }
  const out = {
    ...c,
    modules: c.modules.map((m) => ({ ...m, quiz: m.quiz.map(place) })),
    final: { ...c.final, questions: c.final.questions.map(place) },
  }
  return { content: out, moved }
}

/* --------------------------------------------------------- for prompts */

/** A short map of the programme, for an agent working on one part of it. */
export function outline(c) {
  const skills = (c.skills ?? []).map((s) => `- ${s.id}: ${s.name}`).join('\n')
  const modules = (c.modules ?? [])
    .map((m, i) => `${i + 1}. [${m.id}] ${m.title} (skill ${m.skill}, ${m.level}, ${m.minutes} min) — ${m.outcome}\n   quiz topics: ${(m.quiz ?? []).map((q) => q.topic).filter(Boolean).join('; ') || 'none'}`)
    .join('\n')
  return `Skills:\n${skills}\n\nModules:\n${modules}\n\nFinal assessment: ${c.final?.questions?.length ?? 0} questions.`
}

/** The programme without the weights (the worker sets them), for an agent to read. */
export function forReading(c) {
  const q = ({ weight: _w, ...rest }) => rest
  return {
    ...c,
    modules: (c.modules ?? []).map((m) => ({ ...m, quiz: (m.quiz ?? []).map(q) })),
    final: { ...c.final, questions: (c.final?.questions ?? []).map(q) },
  }
}

export const moduleMinutes = (c) => (c.modules ?? []).reduce((n, m) => n + (m.minutes || 0), 0)
