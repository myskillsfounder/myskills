import { Link } from '@tanstack/react-router'
import { Award, Lock } from 'lucide-react'
import { skillName, type SkillBadge } from '@/lib/skillBadges'

const fmtMonth = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })

// Each programme's badges in its own colours.
const LOOK: Record<string, { ring: string; face: string; ribbon: string }> = {
  'digital-marketing': { ring: 'from-violet-300 to-violet-600', face: 'from-violet-500 to-violet-700', ribbon: 'bg-violet-600' },
  'career-readiness': { ring: 'from-amber-200 to-amber-500', face: 'from-amber-400 to-orange-500', ribbon: 'bg-amber-500' },
}

/** A badge as a medal: a ringed disc with a ribbon. */
function Medal({ programme, locked = false }: { programme?: string; locked?: boolean }) {
  const look = LOOK[programme ?? ''] ?? LOOK['career-readiness']
  return (
    <span aria-hidden className="relative block h-16 w-14">
      <span className={`absolute bottom-0 left-2 h-5 w-3 -skew-x-12 rounded-sm ${locked ? 'bg-ink-200' : look.ribbon}`} />
      <span className={`absolute bottom-0 right-2 h-5 w-3 skew-x-12 rounded-sm ${locked ? 'bg-ink-200' : look.ribbon}`} />
      <span className={`absolute left-0 top-0 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br p-1 shadow-md ${locked ? 'from-ink-100 to-ink-200' : look.ring}`}>
        <span className={`flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br text-white ring-2 ring-white/70 ${locked ? 'from-ink-200 to-ink-300 text-ink-400' : look.face}`}>
          {locked ? <Lock size={18} /> : <Award size={22} />}
        </span>
      </span>
    </span>
  )
}

/**
 * Skill badges along the top of the profile: each one awarded by a mentor
 * once the student earned the skill in practice. Read-only: a badge is
 * something a person vouched for, never typed in.
 */
export function BadgesRow({ badges }: { badges: SkillBadge[] }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">Skill badges</h2>
          <p className="text-sm text-ink-500">
            {badges.length
              ? `${badges.length} ${badges.length === 1 ? 'skill' : 'skills'} my mentors have vouched for.`
              : 'Practise a skill, then your mentor can award you its badge.'}
          </p>
        </div>
        <Link to="/practice" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
          {badges.length ? 'Earn more' : 'Start practising'} →
        </Link>
      </div>

      <ul className="mt-4 flex gap-3 overflow-x-auto pb-1">
        {badges.map((b) => (
          <li key={b.id} className="flex w-32 shrink-0 flex-col items-center rounded-2xl border border-ink-900/[0.06] bg-gradient-to-b from-white to-ink-50 px-2 pb-3 pt-4 text-center">
            <Medal programme={b.programme} />
            <p className="mt-2 line-clamp-2 text-xs font-semibold leading-snug text-ink-900">{skillName(b.skill)}</p>
            <p className="mt-0.5 line-clamp-1 text-[10px] text-ink-500">
              {b.mentor?.full_name ? `${b.mentor.full_name} · ` : ''}
              {fmtMonth(b.awarded_at)}
            </p>
          </li>
        ))}
        {/* Room for what's to come: a few locked medals, never fake ones. */}
        {Array.from({ length: Math.max(0, 6 - badges.length) }, (_, i) => (
          <li key={`locked-${i}`} className="flex w-32 shrink-0 flex-col items-center rounded-2xl border border-dashed border-ink-200 px-2 pb-3 pt-4 text-center">
            <Medal locked />
            <p className="mt-2 text-xs font-medium text-ink-400">Next badge</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
