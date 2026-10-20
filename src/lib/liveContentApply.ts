/**
 * Puts the published course-engine wording of Global Leadership and Digital
 * Marketing into the content modules the pages read (see liveContent.ts).
 * Only wording changes: the structure (which modules, tasks and questions
 * there are) is locked in the engine, so every id here already exists.
 */
import { MODULE_CONTENT } from './careerReadinessContent'
import { PERSONAL_DEVELOPMENT_MODULES } from './programmes'
import { LIFE_SKILLS, PROGRAMME_SKILLS } from './lifeSkills'
import { decisionLabQuestions } from './decisionLabs'
import { skillTracks } from './skillTracks'
import { APTITUDES } from './dmAptitude'
import type { BuiltinProgramme } from './liveContent'
import type { ProgrammeContent } from './programmeEngine'

const text = (v: unknown, fallback: string) => (typeof v === 'string' && v.trim() ? v : fallback)

function applyGlobalLeadership(c: ProgrammeContent) {
  for (const m of c.modules ?? []) {
    const mc = MODULE_CONTENT.find((x) => x.slug === m.id)
    if (mc) {
      mc.outcome = text(m.outcome, mc.outcome)
      if (m.minutes > 0) mc.minutes = m.minutes
      if (m.learn?.length) mc.learn = m.learn.map((l) => ({ title: l.title, body: l.body }))
      // Tasks keep their keys (t1, t2…), which progress is stored under.
      mc.tasks = mc.tasks.map((t) => {
        const e = m.tasks?.find((x) => x.id === t.key)
        return e ? { ...t, title: text(e.title, t.title), prompt: text(e.prompt, t.prompt), hint: e.hint ?? t.hint } : t
      })
      if (m.reflection) mc.reflection = { prompt: text(m.reflection.prompt, mc.reflection.prompt), hint: m.reflection.hint ?? mc.reflection.hint }
    }
    const meta = PERSONAL_DEVELOPMENT_MODULES.find((x) => x.slug === m.id)
    if (meta) {
      meta.title = text(m.title, meta.title)
      meta.body = text(m.summary, meta.body)
    }
  }
  for (const s of c.skills ?? []) {
    const life = LIFE_SKILLS.find((x) => x.key === s.id)
    if (life) {
      life.name = text(s.name, life.name)
      life.what = text(s.description, life.what)
    }
    const own = PROGRAMME_SKILLS.find((x) => x.key === s.id)
    if (own) own.name = text(s.name, own.name)
  }
}

function applyDigitalMarketing(c: ProgrammeContent) {
  for (const m of c.modules ?? []) {
    const track = skillTracks.find((t) => t.slug === m.id)
    if (track) {
      track.name = text(m.title, track.name)
      track.description = text(m.summary, track.description)
      if (m.quiz?.length) track.questionCount = m.quiz.length
    }
    for (const q of m.quiz ?? []) {
      const d = decisionLabQuestions.find((x) => x.id === q.id)
      if (!d) continue
      // The option ORDER matters: the server's answer key counts on it, and
      // both come from the same published version.
      if (Array.isArray(q.options) && q.options.length >= 2) d.options = [...q.options]
      d.question = text(q.question, d.question)
      d.title = text(q.title, d.title)
      d.competency = text(q.topic, d.competency)
      if (q.difficulty) d.difficulty = q.difficulty
      d.trackName = text(m.title, d.trackName)
      const x = q.context ?? {}
      d.company = text(x.company, d.company)
      d.role = text(x.role, d.role)
      d.industry = text(x.industry, d.industry)
      d.background = text(x.background, d.background)
      d.objective = text(x.objective, d.objective)
      d.information = text(x.information, d.information)
      d.constraints = text(x.constraints, d.constraints)
    }
  }
  for (const s of c.skills ?? []) {
    const a = APTITUDES.find((x) => x.key === s.id)
    if (a) a.name = text(s.name, a.name)
  }
}

export function applyBuiltinProgrammes(all: Record<string, BuiltinProgramme>) {
  try {
    if (all['global-leadership']) applyGlobalLeadership(all['global-leadership'].content as ProgrammeContent)
    if (all['digital-marketing']) applyDigitalMarketing(all['digital-marketing'].content as ProgrammeContent)
  } catch {
    // Something unexpected in the content: the built-in wording stays.
  }
}
