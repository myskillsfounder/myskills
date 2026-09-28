import { Link } from '@tanstack/react-router'
import { Award } from 'lucide-react'
import { skillName, type SkillBadge } from '@/lib/skillBadges'
import { Section } from './ui'

const fmtMonth = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })

/**
 * Skill badges, awarded by the student's mentors once they've earned a skill
 * in practice. Read-only: a skill on a MySkills profile is something a person
 * vouched for, not something the student typed in.
 */
export function SkillsSection({ badges = [] }: { badges?: SkillBadge[] }) {
  return (
    <Section title="Skill Badges">
      {badges.length > 0 ? (
        <ul className="space-y-2">
          {badges.map((b) => (
            <li key={b.id} className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
                <Award size={15} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900">{skillName(b.skill)}</p>
                <p className="truncate text-[11px] text-ink-600">
                  {b.mentor?.full_name ? `by ${b.mentor.full_name} · ` : ''}
                  {fmtMonth(b.awarded_at)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-relaxed text-ink-500">
          Practise a skill, then your mentor can award you its badge.{' '}
          <Link to="/practice" className="font-semibold text-brand-700 hover:underline">
            Find a mentor
          </Link>
        </p>
      )}
    </Section>
  )
}
