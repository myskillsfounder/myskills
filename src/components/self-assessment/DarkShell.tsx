import type { ReactNode } from 'react'
import { Link, type LinkProps } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Eyebrow } from '@/components/landing/Eyebrow'
import { GlowOrb, GridBackdrop } from '@/components/landing/GridBackdrop'

/**
 * A focused, full-screen dark page for an assessment: the same surface, grid
 * and glow as the Career Readiness landing page, with a way back and nothing
 * else in the chrome. Shared by every assessment so they read as one system
 * instead of a card dropped into the light app shell.
 */
export function DarkShell({
  back,
  eyebrow,
  title,
  description,
  children,
}: {
  back: { to: LinkProps['to']; label: string }
  eyebrow: string
  title: ReactNode
  description: ReactNode
  children: ReactNode
}) {
  return (
    <div className="surface-wood-dark relative min-h-screen overflow-hidden">
      <GridBackdrop mask="ellipse 75% 60% at 50% 0%" />
      <GlowOrb className="-left-24 top-24 h-72 w-72" color="rgba(143,133,238,0.16)" />
      <GlowOrb className="-right-24 bottom-10 h-72 w-72" color="rgba(211,164,65,0.10)" />

      <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-5 sm:px-6">
        <div className="flex items-center justify-between">
          <Link
            to={back.to}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft size={16} /> {back.label}
          </Link>
          <span className="font-display text-sm font-semibold text-white/80">MySkills</span>
        </div>

        <header className="rise-in mt-10 mb-8">
          <Eyebrow dark>{eyebrow}</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/70">{description}</p>
        </header>

        {children}
      </div>
    </div>
  )
}

/** The dark "couldn't load" strip every assessment page shows the same way. */
export function DarkError({ title, message }: { title: string; message: string }) {
  return (
    <p role="alert" className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      <span className="font-semibold">{title}</span> {message}
    </p>
  )
}
