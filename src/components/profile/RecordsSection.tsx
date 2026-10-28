import { Award, Briefcase, CalendarCheck, Clock, Flame, FolderCheck, type LucideIcon } from 'lucide-react'
import type { Records } from '@/lib/personalBlueprint'

function Record({ icon: Icon, tile, label, value, unit }: { icon: LucideIcon; tile: string; label: string; value: number | string; unit: string }) {
  return (
    <div className="rounded-2xl border border-ink-900/[0.08] bg-white p-4">
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tile}`}>
        <Icon size={16} />
      </span>
      <p className="mt-2.5 text-xs font-medium text-ink-500">{label}</p>
      <p className="mt-0.5 font-display text-2xl font-semibold text-ink-900">{value}</p>
      <p className="text-xs text-ink-500">{unit}</p>
    </div>
  )
}

const plural = (n: number, one: string, many = `${one}s`) => (n === 1 ? one : many)

/**
 * Milestones from what the student has actually done in MySkills: days in a
 * row, hours, days active, and what mentors and companies have confirmed.
 * Nothing is typed in.
 */
export function RecordsSection({
  records,
  certificates,
  projects,
  internships,
  badges,
}: {
  records: Records | null
  certificates: number
  projects: number
  internships: number
  badges: number
}) {
  const r = records ?? { bestStreak: 0, hours: 0, daysActive: 0 }
  const hours = r.hours >= 10 ? Math.round(r.hours) : Math.round(r.hours * 10) / 10
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-ink-900">Personal records</h2>
      <p className="text-sm text-ink-500">Milestones that reflect my journey.</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Record icon={Flame} tile="bg-orange-100 text-orange-600" label="Longest streak" value={r.bestStreak} unit={plural(r.bestStreak, 'day')} />
        <Record icon={Clock} tile="bg-violet-100 text-violet-600" label="Learning time" value={hours} unit={plural(hours, 'hour')} />
        <Record icon={CalendarCheck} tile="bg-sky-100 text-sky-600" label="Days active" value={r.daysActive} unit={plural(r.daysActive, 'day')} />
        <Record icon={Award} tile="bg-amber-100 text-amber-700" label="Certificates" value={certificates} unit={`${plural(certificates, 'certificate')}, ${badges} skill ${plural(badges, 'badge')}`} />
        <Record icon={FolderCheck} tile="bg-emerald-100 text-emerald-600" label="Projects" value={projects} unit="mentor-verified" />
        <Record icon={Briefcase} tile="bg-pink-100 text-pink-600" label="Internships" value={internships} unit="confirmed" />
      </div>
    </section>
  )
}
