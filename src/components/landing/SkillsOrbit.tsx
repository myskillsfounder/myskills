import { useRef, type ComponentType, type CSSProperties, type MouseEvent } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import {
  BarChart3,
  FileText,
  MessageSquare,
  PersonStanding,
  Search,
  Sprout,
  Target,
  Users,
  Workflow,
} from 'lucide-react'

type IconType = ComponentType<{ size?: number; className?: string }>

interface OrbitSkill {
  icon: IconType
  label: string
  domain: 'personal' | 'professional'
  radius: number
  /** Degrees around the ring, 0 = due right. Every item shares one
   *  DURATION (below) — same angular speed for all eight — so the two
   *  rings stay rigidly spaced forever instead of drifting into each
   *  other. That drift was the previous version's actual bug: different
   *  speeds per ring meant labels periodically overlapped as they
   *  crossed paths. */
  angle: number
}

const DURATION = 46
const RADIUS_OUTER = 160
const RADIUS_INNER = 104

// Outer ring (personal) at 0/90/180/270°, inner ring (professional) offset
// by 45° from it — the two rings can never align, so a wide label on one
// ring never lands on top of a label on the other.
const SKILLS: OrbitSkill[] = [
  { icon: Target, label: 'Goal Setting', domain: 'personal', radius: RADIUS_OUTER, angle: 0 },
  { icon: MessageSquare, label: 'Communication', domain: 'personal', radius: RADIUS_OUTER, angle: 90 },
  { icon: Users, label: 'Leadership', domain: 'personal', radius: RADIUS_OUTER, angle: 180 },
  { icon: Sprout, label: 'Growth Mindset', domain: 'personal', radius: RADIUS_OUTER, angle: 270 },
  { icon: Search, label: 'SEO & AEO', domain: 'professional', radius: RADIUS_INNER, angle: 45 },
  { icon: BarChart3, label: 'Analytics', domain: 'professional', radius: RADIUS_INNER, angle: 135 },
  { icon: Workflow, label: 'Google Ads', domain: 'professional', radius: RADIUS_INNER, angle: 225 },
  { icon: FileText, label: 'Content', domain: 'professional', radius: RADIUS_INNER, angle: 315 },
]

const DOMAIN_STYLE = {
  personal: 'from-brand-500 to-brand-700',
  professional: 'from-gold-400 to-gold-600',
} as const

/**
 * The hero's visual: a student at the centre, personal and professional
 * skills orbiting around them at two fixed, evenly-spaced radii. Built with
 * real CSS 3D (perspective + per-item depth) and a Framer Motion mouse-tilt
 * spring — not a static illustration.
 *
 * The figure is Lucide's PersonStanding, not a modelled/rigged 3D
 * character: there's no 3D-asset pipeline in this session to build and
 * animate an actual body. This is the honest, achievable version of "a
 * student equipping skills" — a real figure, with real skills visibly
 * attaching to them, rather than an abstract icon standing in for one.
 */
export function SkillsOrbit() {
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 120, damping: 20 })
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 120, damping: 20 })

  function onMouseMove(e: MouseEvent) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    mx.set((e.clientX - rect.left) / rect.width - 0.5)
    my.set((e.clientY - rect.top) / rect.height - 0.5)
  }
  function onMouseLeave() {
    mx.set(0)
    my.set(0)
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative mx-auto flex h-[360px] w-full max-w-[420px] items-center justify-center sm:h-[440px]"
      style={{ perspective: 1000 }}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative flex h-full w-full items-center justify-center"
      >
        {/* Orbit rings, purely decorative depth cues */}
        <span
          className="absolute rounded-full border border-white/[0.07]"
          style={{ height: RADIUS_INNER * 2 + 56, width: RADIUS_INNER * 2 + 56 }}
        />
        <span
          className="absolute rounded-full border border-white/10"
          style={{ height: RADIUS_OUTER * 2 + 56, width: RADIUS_OUTER * 2 + 56 }}
        />

        {/* The student — the constant everything else orbits and attaches to */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="glow-edge relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-e2 sm:h-28 sm:w-28"
          style={{ transform: 'translateZ(40px)' }}
        >
          <PersonStanding size={44} strokeWidth={1.75} />
          <span className="live-ping absolute inset-0 rounded-full text-brand-400" />
        </motion.div>

        {SKILLS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15 + i * 0.06, ease: [0.2, 0.8, 0.2, 1] }}
            className="absolute left-1/2 top-1/2 h-0 w-0"
            style={
              {
                animation: `orbit ${DURATION}s linear infinite`,
                animationDelay: `${-(DURATION * (s.angle / 360))}s`,
                '--orbit-radius': `${s.radius}px`,
              } as CSSProperties
            }
          >
            <div
              className="card-glass-dark absolute flex w-max -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full py-1.5 pr-3 pl-1.5"
              style={{ transform: `translateZ(${s.domain === 'personal' ? 24 : 8}px)` }}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white ${DOMAIN_STYLE[s.domain]}`}
              >
                <s.icon size={12} />
              </span>
              <span className="text-[11px] font-semibold text-white/85">{s.label}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
