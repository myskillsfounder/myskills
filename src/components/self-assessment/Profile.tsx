import { Link, type LinkProps } from '@tanstack/react-router'
import { ArrowRight, Quote } from 'lucide-react'
import { Eyebrow } from '@/components/landing/Eyebrow'

/** One scored dimension, with everything needed to show it. */
export interface ProfileSkill {
  key: string
  name: string
  score: number
  level: string
  /** The plain-language read-out for this level. */
  readout: string
}

const W = 360
const H = 268
const CX = W / 2
const CY = 134
const R = 76

/** A point on the radar: `frac` of the way out along axis `i` of `n`. */
const point = (i: number, n: number, frac: number, extra = 0) => {
  const a = (-90 + (360 / n) * i) * (Math.PI / 180)
  const r = R * frac + extra
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) }
}

/** How far out a score sits: never collapse to the centre, so a low score
 *  still reads as a shape. */
const fraction = (score: number, min: number, max: number) =>
  Math.max((score - min) / (max - min), 0.1)

/** Split a long label over two lines at the space that balances them best, so
 *  names like "Creativity & storytelling" fit beside the chart. */
function labelLines(name: string): string[] {
  if (name.length <= 13 || !name.includes(' ')) return [name]
  let best = 0
  let bestGap = Infinity
  for (let i = 0; i < name.length; i++) {
    if (name[i] !== ' ') continue
    const gap = Math.abs(i - (name.length - i - 1))
    if (gap < bestGap) {
      bestGap = gap
      best = i
    }
  }
  return [name.slice(0, best), name.slice(best + 1)]
}

/** The scores as one shape — strengths bulge out, gaps pull in. */
function Radar({ skills, min, max }: { skills: ProfileSkill[]; min: number; max: number }) {
  const n = skills.length
  const ring = (frac: number) =>
    skills
      .map((_, i) => {
        const p = point(i, n, frac)
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
      })
      .join(' ')
  const shape = skills
    .map((s, i) => {
      const p = point(i, n, fraction(s.score, min, max))
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mx-auto w-full max-w-[360px]"
      role="img"
      aria-label="Your scores as a radar chart"
    >
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={ring(f)} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
      ))}
      {skills.map((s, i) => {
        const end = point(i, n, 1)
        return <line key={s.key} x1={CX} y1={CY} x2={end.x} y2={end.y} stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
      })}
      <polygon points={shape} fill="rgba(143,133,238,0.28)" stroke="#b7b0f4" strokeWidth="2" strokeLinejoin="round" />
      {skills.map((s, i) => {
        const p = point(i, n, fraction(s.score, min, max))
        const l = point(i, n, 1, 20)
        const anchor = l.x < CX - 6 ? 'end' : l.x > CX + 6 ? 'start' : 'middle'
        return (
          <g key={s.key}>
            <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#8f85ee" strokeWidth="2" />
            <text
              textAnchor={anchor}
              dominantBaseline="middle"
              className="fill-white/75"
              style={{ fontSize: 11, fontWeight: 600 }}
            >
              {labelLines(s.name).map((line, li, all) => (
                <tspan key={li} x={l.x} y={l.y + (li - (all.length - 1) / 2) * 13}>
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/**
 * A self-assessment result on the site's dark theme: the scores as one shape,
 * a "start here" panel, then a level and read-out per dimension. Shared by
 * the Career Readiness and Digital Marketing aptitude assessments, so both
 * read as the same experience. Framed as a baseline, never a grade.
 */
export function SkillProfile({
  skills,
  min,
  max,
  levelTone,
  start,
  detail,
  reflection,
  footnote,
}: {
  skills: ProfileSkill[]
  /** The lowest and highest score a dimension can have. */
  min: number
  max: number
  /** Tailwind classes for each level's pill, keyed by level name. */
  levelTone: Record<string, string>
  start: {
    title: string
    body: string
    cta: { to: LinkProps['to']; label: string }
  }
  detail: { title: string; intro: string }
  /** The learner's closing answer, if they gave one. */
  reflection?: { label: string; text: string } | null
  footnote: string
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-5">
        <section className="card-glass-dark glow-edge flex flex-col p-6 lg:col-span-2">
          <Eyebrow dark>Your shape</Eyebrow>
          <div className="mt-3 flex flex-1 items-center">
            <Radar skills={skills} min={min} max={max} />
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
              {start.title}
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">{start.body}</p>
          </div>
          <Link
            to={start.cta.to}
            className="press relative mt-6 inline-flex w-fit items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink-900 shadow-e2 transition-colors hover:bg-brand-50"
          >
            {start.cta.label}
            <ArrowRight size={16} />
          </Link>
        </section>
      </div>

      <section>
        <Eyebrow dark>Skill by skill</Eyebrow>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {detail.title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">{detail.intro}</p>
        <ul className="mt-6 space-y-3">
          {skills.map((s) => (
            <li key={s.key} className="card-glass-dark p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="font-display text-lg font-semibold leading-snug text-white">{s.name}</h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${levelTone[s.level]}`}>
                    {s.level}
                  </span>
                </div>
                <p className="font-display text-2xl font-semibold leading-none tabular-nums text-white">
                  {s.score}
                  <span className="text-sm font-medium text-white/40"> / {max}</span>
                </p>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-200"
                  style={{ width: `${Math.max(6, Math.round(((s.score - min) / (max - min)) * 100))}%` }}
                />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/70">{s.readout}</p>
            </li>
          ))}
        </ul>
      </section>

      {reflection && (
        <section className="card-glass-dark p-5 sm:p-6">
          <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-brand-200">
            <Quote size={14} /> {reflection.label}
          </p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white/85">{reflection.text}</p>
        </section>
      )}

      <p className="text-xs leading-relaxed text-white/50">{footnote}</p>
    </div>
  )
}
