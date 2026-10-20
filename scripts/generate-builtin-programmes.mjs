// Writes docs/supabase-builtin-programmes.sql from builtin-programmes.template.sql,
// filling in the content of Global Leadership and Digital Marketing that lives
// in the app's code (module text, practice questions). The rest (aptitude
// statements, practice answers, Foundation questions) the SQL reads from the
// database, so nothing is typed twice. Re-run it after changing the template.
//
// Run: node scripts/generate-builtin-programmes.mjs
// (Node 22.6+ runs the .ts content files directly.)
import fs from 'node:fs'
import { MODULE_CONTENT } from '../src/lib/careerReadinessContent.ts'
import { LIFE_SKILLS, PROGRAMME_SKILLS, skillKeyForModule } from '../src/lib/lifeSkills.ts'
import { decisionLabQuestions } from '../src/lib/decisionLabs.ts'
import { skillTracks } from '../src/lib/skillTracks.ts'

const career = JSON.parse(fs.readFileSync(new URL('../src/content/career-readiness.json', import.meta.url), 'utf8'))

// The Digital Marketing aptitudes live in a file that also talks to the
// database, so read their names and tracks from its source instead.
const dmSrc = fs.readFileSync(new URL('../src/lib/dmAptitude.ts', import.meta.url), 'utf8')
const APTITUDES = [...dmSrc.matchAll(/\{ key: '([a-z]+)', name: '([^']+)', tracks: \[([^\]]*)\] \}/g)].map((m) => ({
  key: m[1],
  name: m[2],
  tracks: [...m[3].matchAll(/'([^']+)'/g)].map((t) => t[1]),
}))
if (APTITUDES.length !== 5) throw new Error(`Expected 5 Digital Marketing aptitudes, found ${APTITUDES.length}`)

const lit = (v) => `$j$${JSON.stringify(v)}$j$::jsonb`
const txt = (s) => `$t$${s ?? ''}$t$`
const NL = '\n'

// Global Leadership: 14 skills (WHO's ten and the programme's own four), one module each.
const glSkills = [
  ...LIFE_SKILLS.map((s) => ({ id: s.key, name: s.name, description: s.what })),
  ...PROGRAMME_SKILLS.map((s) => ({ id: s.key, name: s.name, description: '' })),
]
const glModules = career.modules.map((meta) => {
  const c = MODULE_CONTENT.find((m) => m.slug === meta.slug)
  if (!c) throw new Error(`No content for module ${meta.slug}`)
  return {
    id: meta.slug,
    title: meta.title,
    summary: meta.body,
    skill: skillKeyForModule(meta.slug),
    level: 'foundation',
    outcome: c.outcome,
    minutes: c.minutes,
    learn: c.learn,
    tasks: c.tasks.map((t) => ({ id: t.key, title: t.title, prompt: t.prompt, hint: t.hint })),
    reflection: c.reflection,
    quiz: [],
  }
})

// Digital Marketing: the 8 tracks are modules of scenario questions; each
// track's skill is the first aptitude that leans on it.
const dmSkills = APTITUDES.map((a) => ({ id: a.key, name: a.name, description: '' }))
const dmTracks = skillTracks.map((t, i) => ({
  ord: i,
  id: t.slug,
  title: t.name,
  summary: t.description,
  skill: APTITUDES.find((a) => a.tracks.includes(t.slug))?.key ?? APTITUDES[0].key,
}))
const dmQuestions = decisionLabQuestions.map((q, i) => ({
  ord: i,
  id: q.id,
  track: q.track,
  title: q.title,
  difficulty: q.difficulty,
  topic: q.competency,
  question: q.question,
  options: q.options,
  context: {
    company: q.company,
    role: q.role,
    industry: q.industry,
    background: q.background,
    objective: q.objective,
    information: q.information,
    constraints: q.constraints,
  },
}))

// Dollar-quoted text must not contain its own delimiter.
const everything = JSON.stringify([glSkills, glModules, dmSkills, dmTracks, dmQuestions, career])
for (const tag of ['$t$', '$j$']) {
  if (everything.includes(tag)) throw new Error(`Content contains ${tag}; pick another dollar-quote tag`)
}

const data = [
  "-- The app's own content, generated from src/lib (module text, practice questions).",
  'create temp table _bi_gl (skills jsonb, modules jsonb, intro text, outcomes jsonb);',
  `insert into _bi_gl values (${lit(glSkills)}, ${lit(glModules)}, ${txt(career.intro)}, ${lit(career.outcomes)});`,
  '',
  'create temp table _bi_dm_skills (skills jsonb);',
  `insert into _bi_dm_skills values (${lit(dmSkills)});`,
  '',
  'create temp table _bi_dm_tracks (ord int, id text, title text, summary text, skill text);',
  'insert into _bi_dm_tracks values',
  dmTracks.map((t) => `  (${t.ord}, ${txt(t.id)}, ${txt(t.title)}, ${txt(t.summary)}, ${txt(t.skill)})`).join(',' + NL) + ';',
  '',
  'create temp table _bi_dm_questions (ord int, id text, track text, title text, difficulty text, topic text, question text, options jsonb, context jsonb);',
  'insert into _bi_dm_questions values',
  dmQuestions
    .map(
      (q) =>
        `  (${q.ord}, ${txt(q.id)}, ${txt(q.track)}, ${txt(q.title)}, ${txt(q.difficulty)}, ${txt(q.topic)}, ${txt(q.question)}, ${lit(q.options)}, ${lit(q.context)})`,
    )
    .join(',' + NL) + ';',
].join(NL)

const template = fs.readFileSync(new URL('./builtin-programmes.template.sql', import.meta.url), 'utf8')
if (!template.includes('-- @@DATA@@')) throw new Error('Template is missing the -- @@DATA@@ marker')
fs.writeFileSync(new URL('../docs/supabase-builtin-programmes.sql', import.meta.url), template.replace('-- @@DATA@@', data))
console.log(
  `Global Leadership: ${glSkills.length} skills, ${glModules.length} modules. ` +
    `Digital Marketing: ${dmSkills.length} aptitudes, ${dmTracks.length} tracks, ${dmQuestions.length} questions. ` +
    'Wrote docs/supabase-builtin-programmes.sql',
)
