// The review report the team reads on the Agents tab: what the agents did,
// what they changed and why, and what still needs a person.

const SEV = { must_fix: 'Must fix', should_fix: 'Should fix', idea: 'Idea' }

function targetName(t, titles) {
  if (t.startsWith('module:')) return titles.get(t.slice(7)) ?? t.slice(7)
  return { overview: 'Overview', skills: 'Skills', aptitude: 'Aptitude test', project: 'Project', final: 'Final assessment', programme: 'The programme' }[t] ?? t
}

const money = (n) => `$${(n ?? 0).toFixed(2)}`
const count = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`
const ORDER = { must_fix: 0, should_fix: 1, idea: 2 }

function statLine(s) {
  const d = Object.entries(s.difficulty)
    .map(([k, v]) => `${k} ${v}`)
    .join(', ')
  return `${s.skills} skills, ${s.statements} aptitude statements, ${s.modules} modules, ${s.tasks} tasks, ${s.questions} questions (${s.finalQuestions} in the final). Right answer the longest option: ${s.rightIsLongest} of ${s.questions}. Right answers at A–D: ${s.positions.join(', ')}. Difficulty: ${d || 'none'}. Modules ${s.moduleHours} h; overview says ${s.hours} h. Publish problems: ${s.publishProblems}.`
}

export function buildReport({ programme, job, rounds, stats, before, notes, lessons, usage, sources, today, moduleTitles = {} }) {
  const titles = new Map(Object.entries(moduleTitles))
  const out = []
  const last = rounds.at(-1)
  const left = last ? last.toFix : []
  const verdict = last?.review.verdict === 'ready' && !left.some((f) => f.severity === 'must_fix')

  out.push(`# ${programme.title}: ${job.kind === 'draft' ? 'drafted' : 'reviewed and improved'} by the course agents`)
  out.push(
    `${today} · ${count(rounds.length, 'review round')} · ${count(usage.calls, 'call')} to Claude, ${count(usage.web_searches, 'web search', 'web searches')} · cost ${money(usage.cost_usd)}${job.weekly ? ' · weekly check' : ''}`,
  )
  if (job.brief) out.push(`**Instructions:** ${job.brief}`)

  out.push('## Verdict')
  out.push(
    verdict
      ? '**Ready for a person to read through and publish.** The Assessment Agent found nothing left that must be fixed.'
      : `**Needs more work before publishing.** ${left.filter((f) => f.severity === 'must_fix').length} must-fix and ${left.filter((f) => f.severity === 'should_fix').length} should-fix findings were still open at the last review (listed below).`,
  )
  if (last?.review.summary) out.push(last.review.summary)
  if (last?.review.strengths?.length) out.push(`What is good:\n${last.review.strengths.map((s) => `- ${s}`).join('\n')}`)
  for (const n of notes) out.push(`> ${n}`)

  out.push('## Each round')
  for (const r of rounds) {
    const must = r.findings.filter((f) => f.severity === 'must_fix').length
    const should = r.findings.filter((f) => f.severity === 'should_fix').length
    out.push(`### Round ${r.round}: ${must} must fix, ${should} should fix, ${count(r.findings.length - must - should, 'idea')}`)
    if (r.review.summary && r !== last) out.push(r.review.summary)
    const groups = new Map()
    const sorted = r.findings.filter((x) => x.severity !== 'idea').sort((a, b) => ORDER[a.severity] - ORDER[b.severity])
    for (const f of sorted) groups.set(f.target, [...(groups.get(f.target) ?? []), f])
    for (const [t, fs] of groups) {
      out.push(`**${targetName(t, titles)}**\n${fs.map((f) => `- ${SEV[f.severity]}: ${f.problem}${f.fix ? ` *Fix:* ${f.fix}` : ''}${f.source && f.source !== 'Automatic check' ? ` ([source](${f.source}))` : f.source === 'Automatic check' ? ' (automatic check)' : ''}`).join('\n')}`)
    }
    if (r.revised.length) out.push(`Revised: ${r.revised.join('; ')}.`)
    for (const x of r.refused) out.push(`> ${x}`)
  }

  const ideas = rounds.flatMap((r) => r.findings.filter((f) => f.severity === 'idea' || f.target === 'programme'))
  const seen = new Set()
  const forTeam = ideas.filter((f) => !seen.has(f.problem) && seen.add(f.problem))
  if (forTeam.length || left.length) {
    out.push('## For the team')
    if (left.length) out.push(`Still open at the last review:\n${left.map((f) => `- ${SEV[f.severity]} (${targetName(f.target, titles)}): ${f.problem}`).join('\n')}`)
    if (forTeam.length) out.push(`Ideas and decisions for you:\n${forTeam.map((f) => `- ${targetName(f.target, titles)}: ${f.problem}${f.fix ? ` ${f.fix}` : ''}`).join('\n')}`)
  }

  out.push('## The numbers')
  if (before) out.push(`Before: ${statLine(before)}`)
  out.push(`${before ? 'After' : 'Now'}: ${statLine(stats)}`)

  if (lessons.length) {
    out.push('## New playbook rules')
    out.push(`The Assessment Agent added these for every future job (switch any off on this tab):\n${lessons.map((l) => `- ${l.rule}${l.why ? ` *Why:* ${l.why}` : ''}`).join('\n')}`)
  }

  out.push('## Research')
  out.push(`The research brief is under “Research” on this job${sources.length ? `; the searches found ${count(sources.length, 'page')}` : ''}. Check anything that matters against its source before publishing.`)
  out.push('## Before publishing')
  out.push(
    '- Load the result into the draft, read every module and the final as a student would, and fix anything that reads wrong.\n- Have someone who works in the field check technical, legal, health and money details.\n- Preview it as a student, then publish.',
  )
  return out.join('\n\n')
}
