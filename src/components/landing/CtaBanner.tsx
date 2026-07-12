import { ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export function CtaBanner() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
      <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-ink-900 px-6 py-10 sm:flex-row sm:items-center sm:px-10">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Ready to find your skill gaps?
          </h2>
          <p className="mt-2 max-w-md text-sm text-ink-300 sm:text-base">
            Take the free initial assessment and unlock every practice track
            today.
          </p>
        </div>
        <Link
          to="/signup"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-500 sm:w-auto"
        >
          Get started free
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  )
}
