import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-10 pb-14 sm:px-6 sm:pt-16 sm:pb-20 lg:px-8 lg:pt-20">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        {/* Copy */}
        <div>
          <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            Built for digital marketing students
          </span>

          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-5xl lg:text-6xl">
            Prove your skills,{' '}
            <span className="text-brand-600">not just your notes</span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-500 sm:text-lg">
            Practice real-world digital marketing scenarios, get scored against
            industry-level difficulty, and track exactly where you stand across
            8 skill tracks &mdash; from Google Ads to Marketing Automation.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Start the initial assessment
              <ArrowRight size={16} />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-full border border-ink-200 px-6 py-3 text-sm font-semibold text-ink-900 transition-colors hover:border-ink-300"
            >
              See how it works
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-500">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-brand-600" />
              8 skill tracks
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-brand-600" />
              Scenario-based, not trivia
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-brand-600" />
              Free to start
            </span>
          </div>
        </div>

        {/* Preview card */}
        <div className="relative">
          <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-12px_rgba(0,0,0,0.12)] sm:p-6">
            <div className="flex items-center justify-between border-b border-ink-100 pb-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                  Google Ads &middot; Intermediate
                </p>
                <p className="mt-1 text-sm font-semibold text-ink-900">
                  Decision Lab &middot; Scenario 6 of 15
                </p>
              </div>
              <span className="rounded-full bg-ink-900 px-2.5 py-1 text-xs font-medium text-white">
                Live
              </span>
            </div>

            <div className="mt-4 rounded-xl bg-ink-50 p-4">
              <p className="text-sm leading-relaxed text-ink-700">
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
                      ? 'border-brand-200 bg-brand-50 text-brand-800'
                      : 'border-ink-100 text-ink-600'
                  }`}
                >
                  {opt.label}
                  {opt.correct && <CheckCircle2 size={16} className="text-brand-600" />}
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between text-xs text-ink-400">
              <span>Mastery score</span>
              <span className="font-semibold text-ink-900">78 / 100</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
              <div className="h-full w-[78%] rounded-full bg-brand-600" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
