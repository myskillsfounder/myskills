import { ArrowRight, BadgeCheck } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { GridBackdrop } from './GridBackdrop'

export function Hero() {
  return (
    <section className="surface-wood-dark relative overflow-hidden">
      <GridBackdrop mask="ellipse 75% 65% at 30% 20%" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-10 pb-14 sm:px-6 sm:pt-16 sm:pb-20 lg:grid-cols-2 lg:px-8 lg:pt-20">
        {/* Copy */}
        <div className="rise-in">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-mono text-xs font-medium text-white/85">
            <span className="live-ping relative flex h-1.5 w-1.5 rounded-full bg-emerald-400 text-emerald-400" />
            Digital Marketing Programme · Professional skills
          </span>

          <h1 className="mt-5 font-display font-semibold leading-tight tracking-tight text-white">
            <span className="block text-4xl sm:text-5xl lg:text-6xl">
              Learn digital marketing online
            </span>
            <span className="mt-2 block font-display text-2xl text-brand-200 sm:text-3xl lg:text-4xl">
              guided by real experts
            </span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">
            Practice real-world scenarios across 8 skill tracks &mdash; SEO,
            Google Ads, Meta Ads, Analytics and more &mdash; get 1:1 chat
            sessions with industry mentors when you&rsquo;re stuck, and earn
            a free certificate that proves what you can do.
          </p>

          {/* One CTA button. "See how it works" is a lightweight text
              link, not a second button — it just jumps down the page. */}
          <div className="mt-8">
            <Link
              to="/signup"
              className="press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink-900 shadow-e2 transition-colors hover:bg-brand-50"
            >
              Start the Digital Marketing Assessment
              <ArrowRight size={16} />
            </Link>
          </div>

          <a
            href="#how-it-works"
            className="group mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-white/60 transition-colors hover:text-white"
          >
            See how it works
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </a>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/65">
            {['8 skill tracks', '1:1 mentor support', 'Free to start'].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <BadgeCheck size={15} className="text-brand-200" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Preview card */}
        <div className="relative">
          <div className="card-glass-dark p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-wide text-brand-200">
                  Google Ads · Intermediate
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  Decision Lab &middot; Scenario 6 of 15
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 font-mono text-[11px] font-bold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Live
              </span>
            </div>

            <div className="mt-4 rounded-lg bg-white/[0.06] p-4">
              <p className="text-sm leading-relaxed text-white/80">
                CTR is 5%, but conversion rate is 0.2%. Budget is fixed. What
                should you optimize first?
              </p>
            </div>

            <div className="mt-4 space-y-2">
              {[
                { label: 'Landing page experience', correct: true },
                { label: 'Audience targeting', correct: false },
                { label: 'Daily budget', correct: false },
              ].map((opt) => (
                <div
                  key={opt.label}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm ${
                    opt.correct
                      ? 'border-brand-400/40 bg-brand-500/15 text-brand-100'
                      : 'border-white/10 text-white/60'
                  }`}
                >
                  {opt.label}
                  {opt.correct && <BadgeCheck size={16} className="text-brand-200" />}
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between font-mono text-xs text-white/50">
              <span>MASTERY_SCORE</span>
              <span className="font-bold text-white">78 / 100</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-brand-400 to-brand-200" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
