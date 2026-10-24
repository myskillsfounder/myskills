import { Link } from '@tanstack/react-router'
import { ArrowRight, BarChart3, Compass, Lock, Sparkles } from 'lucide-react'
import { setAfterOnboarding } from '@/lib/afterOnboarding'
import { trackEvent } from '@/lib/analytics'
import { pendingAptitudeFor, type TestRoute } from '@/lib/pendingAptitude'

/**
 * The end of a test taken before signing up: the answers are saved on this
 * device, and an account is what turns them into a result. Signing up (or in)
 * leads back to the test's page, which scores them (lib/pendingAptitude.ts).
 */
export function SignUpToSee({ route }: { route: TestRoute }) {
  // A taste of the result: their strongest skill, the rest after signing up.
  const strongest = pendingAptitudeFor(route)?.strongest
  return (
    <div className="card-glass-dark p-5 sm:p-6">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 text-white ring-1 ring-white/25">
        <Lock size={20} />
      </span>
      <h2 className="mt-4 font-display text-2xl font-semibold leading-tight text-white">Your results are ready</h2>
      {strongest && (
        <div className="mt-4 rounded-xl border border-brand-300/30 bg-brand-500/15 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-200">Your strongest pull</p>
          <p className="mt-1 font-display text-xl font-semibold text-white">{strongest}</p>
          <p className="mt-1 text-sm text-white/65">The full profile, skill by skill, is waiting for you.</p>
        </div>
      )}
      <p className="mt-2 text-[15px] leading-relaxed text-white/70">
        Create a free account to see them. Your answers are saved on this device, so you won’t have to take the test
        again.
      </p>
      <ul className="mt-4 space-y-2.5 text-sm text-white/80">
        {[
          { icon: BarChart3, text: 'Your aptitude profile, skill by skill' },
          { icon: Compass, text: 'Where you should start in the programme' },
          { icon: Sparkles, text: 'Practice, a mentor and your Global Readiness Score' },
        ].map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-2.5">
            <Icon size={16} className="shrink-0 text-brand-200" />
            {text}
          </li>
        ))}
      </ul>
      <Link
        to="/signup"
        onClick={() => {
          setAfterOnboarding(route)
          trackEvent('results_signup', { test: route })
        }}
        className="press mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-[15px] font-semibold text-ink-900 shadow-e2"
      >
        Create a free account <ArrowRight size={17} />
      </Link>
      <p className="mt-3 text-center text-sm text-white/60">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-white underline-offset-2 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
