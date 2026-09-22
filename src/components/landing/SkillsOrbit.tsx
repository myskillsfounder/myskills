import { useRef, type ComponentType, type CSSProperties, type MouseEvent } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { BarChart3, GraduationCap, MessageSquare, Search, Sprout, Target, Users, Workflow } from 'lucide-react'

type IconType = ComponentType<{ size?: number; className?: string }>

interface OrbitSkill {
  icon: IconType
  label: string
  domain: 'personal' | 'professional'
  /** Orbit radius in px, and how long one full lap takes — both vary
   *  slightly per card so the ring reads as layered, not mechanical. */
  radius: number
  duration: number
  /** Negative animation-delay = the card's starting position on the ring. */
  startAt: number
}

const SKILLS: OrbitSkill[] = [
  { icon: Target, label: 'Goal Setting', domain: 'personal', radius: 150, duration: 34, startAt: 0 },
  { icon: Search, label: 'SEO & AEO', domain: 'professional', radius: 118, duration: 26, startAt: -4 },
  { icon: MessageSquare, label: 'Communication', domain: 'personal', radius: 150, duration: 34, startAt: -8.5 },
  { icon: BarChart3, label: 'Analytics', domain: 'professional', radius: 118, duration: 26, startAt: -13 },
  { icon: Users, label: 'Leadership', domain: 'personal', radius: 150, duration: 34, startAt: -17 },
  { icon: Workflow, label: 'Google Ads', domain: 'professional', radius: 118, duration: 26, startAt: -19.5 },
  { icon: Sprout, label: 'Growth Mindset', domain: 'personal', radius: 150, duration: 34, startAt: -25.5 },
  { icon: GraduationCap, label: 'Content Marketing', domain: 'professional', radius: 118, duration: 26, startAt: -22.75 },
]

const DOMAIN_STYLE = {
  personal: 'from-brand-500 to-brand-700',
  professional: 'from-gold-400 to-gold-600',
} as const

/**
 * The hero's visual: personal and professional skills, literally orbiting
 * the student — instead of a flat feature card. Built with real CSS 3D
 * (perspective + per-card depth) and Framer Motion (a mouse-tilt spring),
 * not a static illustration. No 3D asset pipeline exists to model an actual
 * rigged figure, so the "student" is the glowing core everything orbits,
 * not a literal body — the honest version of that idea this session can
 * actually ship.
 */
export function SkillsOrbit() {
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 120, damping: 20 })
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 120, damping: 20 })

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
      className="relative mx-auto flex h-[360px] w-full max-w-[420px] items-center justify-center sm:h-[420px]"
      style={{ perspective: 1000 }}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative flex h-full w-full items-center justify-center"
      >
        {/* Orbit rings, purely decorative depth cues */}
        <span className="absolute h-[236px] w-[236px] rounded-full border border-white/10 sm:h-[300px] sm:w-[300px]" />
        <span className="absolute h-[300px] w-[300px] rounded-full border border-white/[0.06] sm:h-[364px] sm:w-[364px]" />

        {/* The core — the student, the constant everything else orbits */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="glow-edge relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-e2 sm:h-24 sm:w-24"
          style={{ transform: 'translateZ(40px)' }}
        >
          <GraduationCap size={32} />
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
                animation: `orbit ${s.duration}s linear infinite`,
                animationDelay: `${s.startAt}s`,
                '--orbit-radius': `${s.radius}px`,
              } as CSSProperties
            }
          >
            <div
              className="card-glass-dark flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full py-1.5 pr-3 pl-1.5"
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
