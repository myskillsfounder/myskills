import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Award, ClipboardCheck, Lock } from 'lucide-react'
import { TIERS } from '@/lib/certificates'
import { fetchMyProgramme, type MyProgramme } from '@/lib/programmeStudent'
import { buttonClass } from '@/components/ui'

/**
 * Global Leadership's Foundation assessment and certificate, under its
 * modules. The questions live in the course engine (its `final`), and the
 * test runs on the engine's page; until they are written this says so.
 * Renders nothing if the programme can't be read (SQL not run yet).
 */
export function GlobalLeadershipFoundation() {
  const [p, setP] = useState<MyProgramme | null>(null)
  useEffect(() => {
    let active = true
    fetchMyProgramme('global-leadership').then(
      (x) => active && setP(x),
      () => {},
    )
    return () => {
      active = false
    }
  }, [])
  if (!p || !('foundation_unlocked' in p)) return null

  const ready = p.content.final.questions.length > 0
  const t = p.final ? TIERS[p.final.kind] : null
  return (
    <section className={`card mt-5 p-5 sm:p-6 ${t ? `${t.ui.border} ${t.ui.bg}` : ''}`}>
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            t ? 'bg-white text-ink-800' : ready && p.foundation_unlocked ? 'bg-brand-50 text-brand-700' : 'bg-ink-100 text-ink-500'
          }`}
        >
          {t ? <Award size={18} /> : ready && p.foundation_unlocked ? <ClipboardCheck size={18} /> : <Lock size={16} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">Foundation certificate</p>
          <h3 className="font-display text-lg font-semibold text-ink-900">Global Leadership Foundation assessment</h3>
          {t && p.final ? (
            <>
              <p className="mt-1 text-sm text-ink-700">
                {t.certLabel} with {p.final.percent}%.
              </p>
              <Link to="/certificate" search={{ programme: p.slug }} className={`mt-3 ${buttonClass('secondary', 'sm')}`}>
                See your certificate <ArrowRight size={15} />
              </Link>
            </>
          ) : !ready ? (
            <p className="mt-1 text-sm text-ink-600">
              Coming soon: one multiple-choice test on the foundations of the fourteen modules, taken once, that earns your
              Foundation certificate (Gold from {TIERS.gold.min}%, Silver from {TIERS.silver.min}%, Bronze below).
            </p>
          ) : p.foundation_unlocked ? (
            <>
              <p className="mt-1 text-sm text-ink-600">
                {p.content.final.questions.length} questions, {p.content.final.minutes} minutes, taken once. Every finished
                attempt earns a Foundation certificate: Gold from {TIERS.gold.min}%, Silver from {TIERS.silver.min}%, Bronze below.
              </p>
              <Link to="/programmes/$slug/final" params={{ slug: p.slug }} className={`mt-3 ${buttonClass('primary', 'sm')}`}>
                Take the Foundation assessment <ArrowRight size={15} />
              </Link>
            </>
          ) : (
            <p className="mt-1 text-sm text-ink-600">
              Opens once you’ve completed all fourteen modules. Taken once, it earns your Foundation certificate.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
