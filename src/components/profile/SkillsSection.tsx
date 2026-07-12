import { useState } from 'react'
import { X } from 'lucide-react'
import type { Profile, ProfilePatch } from '@/lib/profile'
import { Modal, PrimaryButton, Section } from './ui'

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
}: {
  profile: Profile
  save: (patch: ProfilePatch) => Promise<Profile>
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
      {profile.skills.length ? (
        <div className="flex flex-wrap gap-2">
          {profile.skills.map((s) => (
            <span
              key={s}
              className="rounded-full border border-ink-200 bg-ink-50 px-3 py-1 text-sm text-ink-800"
            >
              {s}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-400">Add the marketing skills you’re building.</p>
      )}

      <Modal open={open} title="Edit skills" onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {skills.length === 0 && (
              <p className="text-sm text-ink-400">No skills yet.</p>
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
              className="flex-1 rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
            <PrimaryButton type="submit">Add</PrimaryButton>
          </form>

          {suggestions.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                Suggestions
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => add(s)}
                    className="rounded-full border border-ink-200 px-3 py-1 text-sm text-ink-700 hover:border-ink-300"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end border-t border-ink-100 pt-4">
            <PrimaryButton type="button" onClick={submit}>
              Save
            </PrimaryButton>
          </div>
        </div>
      </Modal>
    </Section>
  )
}
