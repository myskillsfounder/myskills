import { BadgeCheck, Bot, Sparkles, UserRound } from 'lucide-react'

/*
 * A small picture for each "Why MySkills, why now" card on the home page
 * (Paul, 4 Nov 2026: "add graphics or design for these cards"): what each one
 * looks like in the app, drawn in the card's own colour. Illustrative only,
 * nobody's real result.
 */

export type ArtTone = 'violet' | 'teal' | 'amber' | 'pink'

export const TONES: Record<ArtTone, { panel: string; ring: string; icon: string; glow: string }> = {
  violet: { panel: 'from-[#5b4bff]/30 via-[#2a2370]/30 to-transparent', ring: 'ring-[#8f7bff]/30', icon: 'from-[#7b6cf6] to-[#4f46e5]', glow: 'shadow-[0_18px_50px_-24px_rgba(123,108,246,0.9)]' },
  teal: { panel: 'from-teal-400/25 via-[#0f3b4a]/30 to-transparent', ring: 'ring-teal-300/30', icon: 'from-teal-400 to-cyan-600', glow: 'shadow-[0_18px_50px_-24px_rgba(45,212,191,0.8)]' },
  amber: { panel: 'from-amber-400/25 via-[#4a3410]/30 to-transparent', ring: 'ring-amber-300/30', icon: 'from-amber-400 to-orange-500', glow: 'shadow-[0_18px_50px_-24px_rgba(251,191,36,0.8)]' },
  pink: { panel: 'from-pink-400/25 via-[#4a1638]/30 to-transparent', ring: 'ring-pink-300/30', icon: 'from-pink-400 to-fuchsia-600', glow: 'shadow-[0_18px_50px_-24px_rgba(244,114,182,0.8)]' },
}

/** AI in every course: the AI coach answering a student's practice answer. */
function CoachChat() {
  return (
    <div className="flex h-full flex-col justify-center gap-2 px-4">
      <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-white/15 px-3 py-1.5 text-[11px] text-white/90">My ad headline: “Fresh coffee, fast.”</div>
      <div className="flex max-w-[88%] items-start gap-1.5">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7b6cf6] text-white">
          <Bot size={11} />
        </span>
        <div className="rounded-2xl rounded-tl-sm bg-[#7b6cf6]/35 px-3 py-1.5 text-[11px] leading-snug text-white">
          Good hook. Add who it’s for to lift clicks <Sparkles size={10} className="inline text-amber-200" />
        </div>
      </div>
    </div>
  )
}

/** People where it matters: a mentor, a counsellor and a company, and a match made. */
function People() {
  const faces = ['face-1', 'face-4', 'face-3']
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2.5">
      <div className="flex -space-x-3">
        {faces.map((f) => (
          <img key={f} src={`/home/${f}.webp`} alt="" className="h-11 w-11 rounded-full object-cover ring-2 ring-[#0b1b2e]" />
        ))}
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-400/25 text-teal-100 ring-2 ring-[#0b1b2e]">
          <UserRound size={18} />
        </span>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-400/20 px-2.5 py-1 text-[11px] font-semibold text-teal-100">
        <BadgeCheck size={12} /> Mentor accepted your request
      </span>
    </div>
  )
}

/** Start with your strengths: the aptitude test's read, as a radar. */
function StrengthsRadar() {
  // Five axes; the shape is an example, not anyone's result.
  const axes = 5
  const values = [0.9, 0.6, 0.8, 0.5, 0.7]
  const point = (i: number, r: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / axes
    return [50 + r * 34 * Math.cos(a), 50 + r * 34 * Math.sin(a)]
  }
  const ring = (r: number) => Array.from({ length: axes }, (_, i) => point(i, r).join(',')).join(' ')
  return (
    <div className="flex h-full items-center justify-center">
      <svg viewBox="0 0 100 100" className="h-[6.5rem] w-[6.5rem]" aria-hidden>
        {[1, 0.66, 0.33].map((r) => (
          <polygon key={r} points={ring(r)} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
        ))}
        {Array.from({ length: axes }, (_, i) => {
          const [x, y] = point(i, 1)
          return <line key={i} x1="50" y1="50" x2={x} y2={y} stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
        })}
        <polygon points={values.map((v, i) => point(i, v).join(',')).join(' ')} fill="rgba(251,191,36,0.35)" stroke="#fbbf24" strokeWidth="1.5" />
        {values.map((v, i) => {
          const [x, y] = point(i, v)
          return <circle key={i} cx={x} cy={y} r="2" fill="#fde68a" />
        })}
      </svg>
      <ul className="ml-2 space-y-1 text-[10px] text-white/75">
        <li className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> Creativity
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-300/70" /> Analysis
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-300/40" /> Planning
        </li>
      </ul>
    </div>
  )
}

/** Proof employers trust: the Global Readiness Score, checked. */
function ScoreRing() {
  const score = 72
  const c = 2 * Math.PI * 30
  return (
    <div className="flex h-full items-center justify-center gap-3">
      <svg viewBox="0 0 80 80" className="h-[5.5rem] w-[5.5rem] -rotate-90" aria-hidden>
        <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
        <circle cx="40" cy="40" r="30" fill="none" stroke="url(#score-grad)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} />
        <defs>
          <linearGradient id="score-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f472b6" />
            <stop offset="1" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
      <div>
        <p className="font-display text-2xl font-bold leading-none text-white">
          {score}
          <span className="text-xs font-medium text-white/50">/100</span>
        </p>
        <p className="mt-0.5 text-[10px] uppercase tracking-wide text-white/55">Readiness score</p>
        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-pink-400/20 px-2 py-0.5 text-[10px] font-semibold text-pink-100">
          <BadgeCheck size={11} /> Verified by mentor
        </span>
      </div>
    </div>
  )
}

export type ArtKind = 'coach' | 'people' | 'strengths' | 'score'

/** The picture at the top of an "AI era" card, on a panel tinted in its colour. */
export function AiEraArt({ kind, tone }: { kind: ArtKind; tone: ArtTone }) {
  const t = TONES[tone]
  return (
    <div aria-hidden className={`relative h-32 overflow-hidden rounded-xl bg-gradient-to-br ring-1 ${t.panel} ${t.ring}`}>
      <span
        className="absolute inset-0 opacity-40"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1.5px)', backgroundSize: '14px 14px' }}
      />
      <div className="relative h-full">
        {kind === 'coach' && <CoachChat />}
        {kind === 'people' && <People />}
        {kind === 'strengths' && <StrengthsRadar />}
        {kind === 'score' && <ScoreRing />}
      </div>
    </div>
  )
}
