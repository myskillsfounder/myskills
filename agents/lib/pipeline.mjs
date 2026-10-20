// One job, start to finish: research, draft (or start from the current
// version), then review and revise until the Assessment Agent has nothing
// left to fix or the rounds run out. Returns the result and the report; the
// worker saves them.
import * as S from './schemas.mjs'
import * as P from './prompts.mjs'
import { qualityFindings, stats } from './checks.mjs'
import {
  allQuestions,
  assembleDraft,
  balancePositions,
  cleanFrame,
  forReading,
  idsIn,
  mergeFinal,
  mergeFrame,
  mergeModule,
  moduleMinutes,
  outline,
  prefixFor,
} from './content.mjs'
import { buildReport } from './report.mjs'

export class Cancelled extends Error {}

/** Revisions after the first review; every revision is reviewed again. */
export const MAX_REVISIONS = 3
const PARALLEL = 3
const FRAME_TARGETS = new Set(['overview', 'skills', 'aptitude', 'project'])

/** Run `fn` over `items`, at most `limit` at a time, keeping the order. */
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      out[i] = await fn(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return out
}

const withDefaults = (c) => ({
  overview: { summary: '', audience: '', outcomes: [], level: 'beginner', hours: 0, ...(c?.overview ?? {}) },
  skills: c?.skills ?? [],
  aptitude: { items: c?.aptitude?.items ?? [] },
  modules: (c?.modules ?? []).map((m) => ({ learn: [], tasks: [], reflection: { prompt: '', hint: '' }, quiz: [], ...m })),
  final: { minutes: 30, pass_percent: 60, questions: [], ...(c?.final ?? {}) },
  project: { brief: '', deliverables: [], rubric: [], ...(c?.project ?? {}) },
})

/** The start of new ids: what the programme already uses, else from its address. */
function prefixOf(content, slug) {
  const m = /^([a-z][a-z0-9]*)-m\d+$/.exec(content.modules?.[0]?.id ?? '')
  return m ? m[1] : prefixFor(slug)
}

/** Where a finding belongs: a module, the final, a frame part, or the team. */
function normaliseTarget(t, content) {
  const s = String(t ?? '').trim()
  if (FRAME_TARGETS.has(s) || s === 'final' || s === 'programme') return s
  const id = s.startsWith('module:') ? s.slice(7) : s
  if (content.modules.some((m) => m.id === id)) return `module:${id}`
  for (const m of content.modules) if (m.quiz.some((q) => q.id === id)) return `module:${m.id}`
  if (content.final.questions.some((q) => q.id === id)) return 'final'
  return 'programme'
}

/**
 * claim: what agent_claim_job() returned. ctx: { claude, progress(stage),
 * usage, budgetUsd, today, log }. progress() returns the job's status.
 */
export async function runJob(claim, ctx) {
  const { job, programme } = claim
  const { claude, usage, log = () => {} } = ctx
  const locked = programme.source === 'built-in'
  const base = withDefaults(claim.content)
  const prefix = prefixOf(base, programme.slug)
  const today = ctx.today ?? new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const style = P.houseStyle(today)
  const rules = P.playbookText(claim.playbook)
  const architect = [style, P.ARCHITECT, rules]
  const assessor = [style, P.ASSESSOR, rules]
  const notes = []

  const step = async (stage) => {
    log(stage)
    if ((await ctx.progress(stage, usage.toJSON())) === 'cancelled') throw new Cancelled()
  }
  const overBudget = () => usage.cost >= ctx.budgetUsd

  // 1. Research.
  await step('Researching the field')
  const research = await claude.research({
    system: assessor,
    label: 'research',
    prompt: P.researchPrompt({ title: programme.title, kind: programme.kind, brief: job.brief, outline: job.kind === 'improve' ? outline(base) : null, today }),
  })
  const researchBlock = `RESEARCH BRIEF (by the Assessment Agent, ${today})\n\n${research.brief || 'No research came back.'}`

  // 2. The programme to review: a new draft, or the current version.
  let content
  if (job.kind === 'draft') {
    await step('Planning the programme')
    const started = base.skills.length || base.overview.summary ? { overview: base.overview, skills: base.skills, aptitude: base.aptitude.items, project: base.project } : null
    const bp = await claude.json({
      system: architect,
      context: [researchBlock],
      prompt: P.blueprintPrompt({ title: programme.title, kind: programme.kind, brief: job.brief, started }),
      schema: S.blueprint,
      label: 'blueprint',
    })
    if (!bp.modules?.length) throw new Error('The plan came back with no modules.')
    const frame = cleanFrame(bp, prefix)
    const plan = `${outline({ skills: frame.skills, modules: [] }).split('\n\nModules')[0]}\n\nModules:\n${bp.modules.map((m, i) => `${i + 1}. ${m.title} (skill ${m.skill}, ${m.level}): ${m.outcome}`).join('\n')}`
    let written = 0
    await step(`Writing ${bp.modules.length} modules`)
    const modules = await mapLimit(bp.modules, PARALLEL, async (o, i) => {
      const m = await claude.json({
        system: architect,
        context: [researchBlock],
        prompt: P.modulePrompt({ n: i + 1, total: bp.modules.length, id: `${prefix}-m${String(i + 1).padStart(2, '0')}`, outline: o, plan }),
        schema: S.module,
        label: `module ${i + 1}`,
      })
      written++
      await step(`Writing modules (${written} of ${bp.modules.length} done)`)
      return m
    })
    await step('Writing the final assessment')
    const draftSoFar = assembleDraft({ frame, modules, finalQuestions: [], prefix })
    const fin = await claude.json({
      system: architect,
      context: [researchBlock],
      prompt: P.finalPrompt({ plan: outline(draftSoFar), finalPlan: bp.final_plan, skills: frame.skills.map((s) => s.id) }),
      schema: S.final,
      label: 'final',
    })
    content = assembleDraft({ frame, modules, finalQuestions: fin.questions ?? [], prefix })
  } else {
    content = base
  }
  if (!locked) content = balancePositions(content).content

  // 3. Review and revise.
  const rounds = []
  let previous = null
  for (let round = 1; ; round++) {
    if (overBudget()) {
      notes.push(`Stopped before review round ${round}: the job reached its $${ctx.budgetUsd} budget.`)
      break
    }
    await step(`Reviewing (round ${round})`)
    const auto = qualityFindings(content, { locked, original: locked ? base : null })
    const targets = ['overview', 'skills', 'aptitude', 'project', ...content.modules.map((m) => `module:${m.id}`), ...(content.final.questions.length ? ['final'] : [])]
    const review = await claude.json({
      system: assessor,
      context: [researchBlock, `THE PROGRAMME (${programme.title})\n\`\`\`json\n${JSON.stringify(forReading(content))}\n\`\`\``],
      prompt: P.reviewPrompt({ title: programme.title, kind: job.kind, brief: job.brief, round, maxRounds: MAX_REVISIONS + 1, locked, targets, auto, previous, today }),
      schema: S.review,
      label: `review ${round}`,
      maxTokens: 64000,
    })
    const reviewed = (review.findings ?? []).map((f) => ({ ...f, target: normaliseTarget(f.target, content) }))
    const findings = [...auto, ...reviewed]
    const toFix = findings.filter((f) => f.severity !== 'idea' && f.target !== 'programme')
    const r = { round, review, auto, findings, toFix, refused: [], revised: [] }
    rounds.push(r)
    if (!toFix.length) break
    if (round > MAX_REVISIONS) break
    if (overBudget()) {
      notes.push(`Stopped before revising round ${round}: the job reached its $${ctx.budgetUsd} budget.`)
      break
    }

    // Revise: each module, the final and the frame are revised separately
    // (and in parallel), then put together.
    const groups = new Map()
    for (const f of toFix) {
      const key = FRAME_TARGETS.has(f.target) ? 'frame' : f.target
      groups.set(key, [...(groups.get(key) ?? []), f])
    }
    await step(`Revising (round ${round}: ${groups.size} ${groups.size === 1 ? 'part' : 'parts'})`)
    const plan = outline(content)
    const answers = await mapLimit([...groups], PARALLEL, async ([key, fs]) => {
      if (key === 'frame') {
        const frame = { overview: content.overview, skills: content.skills, aptitude: content.aptitude.items, project: content.project }
        const trained = [...new Set(content.modules.map((m) => m.skill))]
        const revised = await claude.json({
          system: architect,
          context: [researchBlock],
          prompt: P.reviseFramePrompt({ frame, findings: fs, locked, trained, moduleHours: Math.round(moduleMinutes(content) / 60) }),
          schema: S.frame,
          label: `revise frame ${round}`,
        })
        return { key, revised }
      }
      if (key === 'final') {
        const revised = await claude.json({
          system: architect,
          context: [researchBlock],
          prompt: P.reviseFinalPrompt({ final: forReading(content).final, findings: fs, locked, plan }),
          schema: S.final,
          label: `revise final ${round}`,
        })
        return { key, revised }
      }
      const m = forReading(content).modules.find((x) => `module:${x.id}` === key)
      const revised = await claude.json({
        system: architect,
        context: [researchBlock],
        prompt: P.reviseModulePrompt({ module: m, findings: fs, locked, plan }),
        schema: S.module,
        label: `revise ${m.id} ${round}`,
      })
      return { key, revised }
    })

    const used = idsIn(content)
    for (const { key, revised } of answers) {
      if (key === 'frame') {
        const res = mergeFrame(content, revised, { locked, prefix })
        content = res.content
        r.refused.push(...res.notes.map((n) => `Overview, skills and aptitude: ${n}.`))
        r.revised.push('overview, skills, aptitude and project')
      } else if (key === 'final') {
        const res = mergeFinal(content.final, revised.questions, { locked, used, prefix })
        content = { ...content, final: res.final }
        if (res.refused) r.refused.push(`Final assessment: kept as it was, because ${res.refused}.`)
        else r.revised.push('final assessment')
      } else {
        const i = content.modules.findIndex((m) => `module:${m.id}` === key)
        const res = mergeModule(content.modules[i], revised, { locked, used })
        content = { ...content, modules: content.modules.map((m, j) => (j === i ? res.module : m)) }
        if (res.refused) r.refused.push(`“${content.modules[i].title}”: kept as it was, because ${res.refused}.`)
        else r.revised.push(content.modules[i].title)
      }
    }
    if (!locked) content = balancePositions(content).content
    previous = toFix
  }

  // 4. What the team gets.
  await step('Writing the report')
  const lessons = []
  for (const r of rounds) {
    for (const l of r.review.lessons ?? []) {
      if (l.rule?.trim() && !lessons.some((x) => x.rule.toLowerCase() === l.rule.trim().toLowerCase())) lessons.push({ rule: l.rule.trim(), why: l.why?.trim() ?? '' })
    }
  }
  const report = buildReport({ programme, job, rounds, stats: stats(content), before: job.kind === 'improve' ? stats(base) : null, notes, lessons: lessons.slice(0, 5), usage: usage.toJSON(), sources: research.sources, today, moduleTitles: Object.fromEntries(content.modules.map((m) => [m.id, m.title])) })
  const researchText = `${research.brief}\n\n${research.sources.length ? `## Pages the searches found\n${research.sources.map((s) => `- [${s.title}](${s.url})`).join('\n')}` : ''}`.trim()
  return { result: content, report, research: researchText, lessons: lessons.slice(0, 5), questions: allQuestions(content).length }
}
