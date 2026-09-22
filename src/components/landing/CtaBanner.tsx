import { ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { GridBackdrop } from './GridBackdrop'

export function CtaBanner() {
  return (
    <section className="relative overflow-hidden border-t border-white/[0.06] px-4 pt-16 pb-16 sm:px-6 sm:pb-20 lg:px-8">
      <div className="surface-wood-dark glow-edge relative mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 overflow-hidden rounded-xl px-6 py-10 sm:flex-row sm:items-center sm:px-10">
        <GridBackdrop mask="ellipse 70% 90% at 90% 50%" />
        <div className="relative">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Ready to find your skill gaps?
          </h2>
          <p className="mt-2 max-w-md text-sm text-white/70 sm:text-base">
            Take the free Digital Marketing Initial Assessment and unlock every practice track
            today.
          </p>
        </div>
        <Link
          to="/signup"
          className="press relative inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink-900 shadow-e2 transition-colors hover:bg-brand-50 sm:w-auto"
        >
          Get started free
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  )
}
