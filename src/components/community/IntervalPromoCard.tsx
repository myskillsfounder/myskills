import { Link } from '@tanstack/react-router'
import { ArrowRight, CalendarCheck } from 'lucide-react'
import { institutionPartner } from '@/lib/institutions'

/**
 * Small promo for the one exclusive offline partner — the "ad slot" for
 * Community, styled like the page's other feature cards rather than a
 * generic banner. Static content (there's only one partner today); if that
 * changes, this is the natural place to swap in the sidebar's rotating
 * AdSlider instead.
 */
export function IntervalPromoCard() {
  return (
    <Link
      to="/community/institutions"
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-sky-500 p-5 shadow-e2 transition-transform duration-300 hover:-translate-y-0.5 sm:flex-row sm:items-center sm:gap-5 sm:p-6"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10"
      />
      <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80 sm:static sm:mr-1">
        Sponsored
      </span>

      <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-e1 sm:mt-0">
        <CalendarCheck size={22} />
      </span>

      <div className="relative min-w-0 flex-1 pt-4 sm:pt-0">
        <h3 className="font-display text-lg font-semibold text-white">
          Book a free demo with {institutionPartner.name}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-white/85">
          See what an offline session looks like — MySkills' exclusive training partner, taught
          in person.
        </p>
      </div>

      <span className="press relative inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-xl bg-white px-5 text-sm font-semibold text-brand-700 shadow-e1 transition-transform duration-300 group-hover:translate-x-0.5 sm:self-auto">
        Book a demo
        <ArrowRight size={16} />
      </span>
    </Link>
  )
}
