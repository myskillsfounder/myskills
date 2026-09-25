import { Link } from '@tanstack/react-router'
import { ArrowRight, Quote } from 'lucide-react'
import {
  LEVEL_TONE_DARK,
  READOUT,
  SKILLS,
  SKILL_MAX,
  SKILL_MIN,
  orderedSkills,
  suggestedStart,
  type AssessmentResult as Result,
  type SkillKey,
} from '@/lib/careerReadinessAssessment'
import { Eyebrow } from '@/components/landing/Eyebrow'

// Wide enough that the side labels ("Agile working", "Growth mindset") aren't clipped.
const W = 360
const H = 268
const CX = W / 2
const CY = 134
const R = 76

/** A point on the radar: `frac` of the way out along skill `i`'s axis. */
const point = (i: number, frac: number, extra = 0) => {
  const a = (-90 + (360 / SKILLS.length) * i) * (Math.PI / 180)
  const r = R * frac + extra
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) }
}

/** The five scores as one shape — strengths bulge out, gaps pull in. */
function SkillRadar({ scores }: { scores: Record<SkillKey, number> }) {
  const ring = (frac: number) =>
    SKILLS.map((_, i) => {
      const p = point(i, frac)
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
    }).join(' ')

  const shape = SKILLS.map((s, i) => {
    const raw = ((scores[s.key] ?? SKILL_MIN) - SKILL_MIN) / (SKILL_MAX - SKILL_MIN)
    // Never collapse an axis to the centre: a low score should still read as a shape.
    const p = point(i, Math.max(raw, 0.1))
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
  }).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-[360px]" role="img" aria-label="Your five skill levels as a radar chart">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={ring(f)} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
      ))}
      {SKILLS.map((s, i) => {
        const end = point(i, 1)
        return <line key={s.key} x1={CX} y1={CY} x2={end.x} y2={end.y} stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
      })}
      <polygon points={shape} fill="rgba(143,133,238,0.28)" stroke="#b7b0f4" strokeWidth="2" strokeLinejoin="round" />
      {SKILLS.map((s, i) => {
        const raw = ((scores[s.key] ?? SKILL_MIN) - SKILL_MIN) / (SKILL_MAX - SKILL_MIN)
        const p = point(i, Math.max(raw, 0.1))
        const l = point(i, 1, 20)
        const anchor = l.x < CX - 6 ? 'end' : l.x > CX + 6 ? 'start' : 'middle'
        return (
          <g key={s.key}>
            <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#8f85ee" strokeWidth="2" />
            <text
              x={l.x}
              y={l.y}
              textAnchor={anchor}
              dominantBaseline="middle"
              className="fill-white/75"
              style={{ fontSize: 11, fontWeight: 600 }}
            >
              {s.name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/**
 * A learner's Career Readiness starting point, on the site's dark theme: the
 * five skills as one shape, the module to start with, then a level and a
 * plain read-out per skill. Framed as a baseline — it's deliberately not a
 * score and doesn't touch the Career Readiness Score.
 */
export function AssessmentResult({ result }: { result: Result }) {
  const skills = orderedSkills(result.scores)
  const start = suggestedStart(result.scores)

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-5">
        <section className="card-glass-dark glow-edge flex flex-col p-6 lg:col-span-2">
          <Eyebrow dark>Your shape</Eyebrow>
          <div className="mt-3 flex flex-1 items-center">
            <SkillRadar scores={result.scores} />
          </div>
        </section>

        <section className="surface-wood-dark relative flex flex-col justify-between overflow-hidden rounded-xl border border-white/10 p-6 shadow-e2 sm:p-8 lg:col-span-3">
          <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 opacity-[0.16]">
            <svg width="200" height="200" viewBox="0 0 200 200" fill="none" stroke="#f6e3c8" strokeWidth="2">
              <circle cx="130" cy="70" r="76" />
              <circle cx="130" cy="70" r="56" />
              <circle cx="130" cy="70" r="36" />
              <circle cx="130" cy="70" r="16" />
            </svg>
          </span>
          <div className="relative">
            <Eyebrow dark>Where to start</Eyebrow>
            <p className="mt-3 font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
              {start.module}
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
              It’s your lowest starting point, so it’s where the programme will move the needle most. The
              Career Readiness Programme opens soon — you’re first in line for it.
            </p>
          </div>
          <Link
            to="/career-readiness"
            className="press relative mt-6 inline-flex w-fit items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink-900 shadow-e2 transition-colors hover:bg-brand-50"
          >
            See the programme
            <ArrowRight size={16} />
          </Link>
        </section>
      </div>

      <section>
        <Eyebrow dark>Skill by skill</Eyebrow>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Where you are today
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
          Each skill is read from how often you do the things that build it. A starting point, not a grade —
          it doesn’t change your Career Readiness Score.
        </p>
        <ul className="mt-6 space-y-3">
          {skills.map((s) => (
            <li key={s.key} className="card-glass-dark p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="font-display text-lg font-semibold leading-snug text-white">{s.name}</h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${LEVEL_TONE_DARK[s.level]}`}>
                    {s.level}
                  </span>
                </div>
                <p className="font-display text-2xl font-semibold leading-none tabular-nums text-white">
                  {s.score}
                  <span className="text-sm font-medium text-white/40"> / {SKILL_MAX}</span>
                </p>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-200"
                  style={{ width: `${Math.max(6, Math.round(((s.score - SKILL_MIN) / (SKILL_MAX - SKILL_MIN)) * 100))}%` }}
                />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/70">{READOUT[s.key][s.level]}</p>
            </li>
          ))}
        </ul>
      </section>

      {result.reflection && (
        <section className="card-glass-dark p-5 sm:p-6">
          <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-brand-200">
            <Quote size={14} /> The skill you want to improve
          </p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white/85">{result.reflection}</p>
        </section>
      )}

      <p className="text-xs leading-relaxed text-white/50">
        Mentors see this summary when they review your Career Readiness progress. You get one attempt at this
        assessment.
      </p>
    </div>
  )
}
