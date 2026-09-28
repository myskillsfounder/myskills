import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Award, X } from 'lucide-react'
import type { Profile, ProfilePatch } from '@/lib/profile'
import { skillName, type SkillBadge } from '@/lib/skillBadges'
import { Modal, PrimaryButton, Section } from './ui'

const fmtMonth = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })

const SUGGESTED = [
  'Marketing Fundamentals',
  'Market Research',
  'Meta Ads',
  'Google Ads',
  'SEO & AEO',
  'Analytics',
  'Content Marketing',
  'Marketing Automation & AI',
  'Copywriting',
  'Email Marketing',
]

export function SkillsSection({
  profile,
  save,
  badges = [],
}: {
  profile: Profile
  save: (patch: ProfilePatch) => Promise<Profile>
  /** Skill badges awarded by the student's mentors — proof, not a claim, so
   *  they're shown apart from the skills the student lists and can't be
   *  edited here. */
  badges?: SkillBadge[]
}) {
  const [open, setOpen] = useState(false)
  const [skills, setSkills] = useState<string[]>(profile.skills)
  const [input, setInput] = useState('')

  function add(value: string) {
    const v = value.trim()
    if (!v || skills.includes(v)) return
    setSkills([...skills, v])
    setInput('')
  }
  function remove(value: string) {
    setSkills(skills.filter((s) => s !== value))
  }
  async function submit() {
    await save({ skills })
    setOpen(false)
  }

  const suggestions = SUGGESTED.filter((s) => !skills.includes(s))

  return (
    <Section
      title="Skills"
      onEdit={() => {
        setSkills(profile.skills)
        setOpen(true)
      }}
    >
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Badges from your mentors</p>
        {badges.length > 0 ? (
          <ul className="mt-2 space-y-2">
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
          <p className="mt-1.5 text-xs leading-relaxed text-ink-500">
            Practise a skill, then your mentor can award you its badge.{' '}
            <Link to="/practice" className="font-semibold text-brand-700 hover:underline">
              Find a mentor
            </Link>
          </p>
        )}
      </div>

      {profile.skills.length ? (
        <div className="flex flex-wrap gap-2">
          {profile.skills.map((s) => (
            <span
              key={s}
              className="rounded-full border border-ink-300 bg-ink-100 px-3 py-1 text-sm text-ink-900"
            >
              {s}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-500">Add the other skills you’re building.</p>
      )}

      <Modal open={open} title="Edit skills" onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {skills.length === 0 && (
              <p className="text-sm text-ink-500">No skills yet.</p>
            )}
            {skills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-sm text-brand-800"
              >
                {s}
                <button
                  type="button"
                  onClick={() => remove(s)}
                  aria-label={`Remove ${s}`}
                  className="text-brand-500 hover:text-brand-800"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              add(input)
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Add a skill"
              className="flex-1 rounded-lg border border-ink-300 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
            <PrimaryButton type="submit">Add</PrimaryButton>
          </form>

          {suggestions.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
                Suggestions
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => add(s)}
                    className="rounded-full border border-ink-300 px-3 py-1 text-sm text-ink-800 hover:border-ink-400"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end border-t border-ink-200 pt-4">
            <PrimaryButton type="button" onClick={submit}>
              Save
            </PrimaryButton>
          </div>
        </div>
      </Modal>
    </Section>
  )
}
