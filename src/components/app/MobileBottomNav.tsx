import { useEffect, useRef, useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Dumbbell, LayoutGrid, Sparkles, Star, User } from 'lucide-react'

const TABS = [
  { to: '/dashboard', label: 'Home', icon: LayoutGrid },
  { to: '/practice', label: 'Practice', icon: Dumbbell },
  { to: '/prompt-library', label: 'Prompts', icon: Sparkles },
  { to: '/feedback', label: 'Review', icon: Star },
  { to: '/profile', label: 'Profile', icon: User },
] as const

/**
 * The bar is part of the app layout, so it shows EVERYWHERE by default and we
 * only name the exceptions. (It used to be an allow-list of sections, which
 * silently omitted every page added afterwards.)
 *
 * Hidden on: public/marketing pages, the auth + onboarding funnel, the
 * assessment player (a focused, one-shot flow where a nav bar invites
 * accidental exits) and the certificate page (it's printed).
 */
const HIDE_EXACT = new Set(['/', '/login', '/signup', '/onboarding', '/assessment', '/certificate'])
const HIDE_PREFIX = ['/blog']

const IND_W = 56 // px indicator (bubble) width
const IND_H = 42 // px indicator (bubble) height — a touch shorter than the row
const ROW_H = 44 // px tab row height
const TOP = (ROW_H - IND_H) / 2 // vertical-center the bubble in the row

const PILL_PAD = 8 // px — the `p-2` around the tab row
const EDGE = '0.85rem' // bottom offset of the whole bar (or the safe area)
const GAP = 12 // px — breathing room between the bar and anything above it

/**
 * How far up a page must push its own bottom-pinned controls so they don't
 * collide with this bar. Derived from the constants above, so if the bar's
 * height changes the clearance follows automatically.
 *
 * Usage: `style={{ bottom: BOTTOM_NAV_CLEARANCE }}` on a `fixed` element.
 */
export const BOTTOM_NAV_CLEARANCE = `calc(${ROW_H + PILL_PAD * 2 + GAP}px + max(${EDGE}, env(safe-area-inset-bottom)))`

/**
 * Persistent, full-width, rounded floating "liquid glass" mobile bottom bar.
 * Built with CSS backdrop-blur (reliable + full-width on every browser). The
 * active-tab highlight slides between tabs with a springy bounce because this
 * lives in the root layout and survives navigation.
 */
export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const rowRef = useRef<HTMLDivElement>(null)
  const [cell, setCell] = useState(IND_W)

  useEffect(() => {
    const el = rowRef.current
    if (!el) return
    const update = () => setCell(el.clientWidth / TABS.length)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const hidden = HIDE_EXACT.has(pathname) || HIDE_PREFIX.some((p) => pathname.startsWith(p))
  if (hidden) return null

  const activeIndex = TABS.findIndex((t) => pathname === t.to || pathname.startsWith(`${t.to}/`))
  const x = activeIndex >= 0 ? activeIndex * cell + (cell - IND_W) / 2 : 0

  return (
    <nav className="no-print pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 lg:hidden"
      style={{ paddingBottom: `max(${EDGE}, env(safe-area-inset-bottom))` }}>
      <div className="pointer-events-auto relative w-full max-w-lg overflow-hidden rounded-full border border-white/60 bg-white/60 p-2 shadow-[0_12px_40px_rgba(15,15,25,0.22)] backdrop-blur-2xl backdrop-saturate-150">
        {/* glass sheen */}
        <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/55 to-transparent" />

        <div ref={rowRef} className="relative flex w-full items-center">
          {/* sliding liquid indicator */}
          <motion.span
            className="pointer-events-none absolute left-0 rounded-full bg-brand-500/18 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)]"
            style={{ width: IND_W, height: IND_H, top: TOP }}
            initial={false}
            animate={{
              x,
              opacity: activeIndex >= 0 ? 1 : 0,
              scale: activeIndex >= 0 ? [1, 1.18, 1] : 1,
            }}
            transition={{
              x: { type: 'spring', stiffness: 480, damping: 26, mass: 0.9 },
              scale: { duration: 0.42, ease: 'easeInOut' },
              opacity: { duration: 0.2 },
            }}
          >
            <span className="absolute inset-0 rounded-full bg-brand-500/25 blur-md" />
          </motion.span>

          {TABS.map((t, i) => {
            const active = i === activeIndex
            const Icon = t.icon
            return (
              <Link
                key={t.to}
                to={t.to}
                aria-label={t.label}
                className="group relative z-10 flex flex-1 items-center justify-center"
                style={{ height: ROW_H }}
              >
                <motion.span
                  animate={{ scale: active ? 1.1 : 1 }}
                  whileTap={{ scale: 0.82 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  className={`transition-colors duration-300 ${
                    active ? 'text-brand-600' : 'text-ink-500 group-hover:text-brand-500'
                  }`}
                >
                  <Icon size={22} />
                </motion.span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
