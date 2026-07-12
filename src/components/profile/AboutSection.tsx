import { useState } from 'react'
import type { Profile, ProfilePatch } from '@/lib/profile'
import { Modal, PrimaryButton, Section, Textarea } from './ui'

export function AboutSection({
  profile,
  save,
}: {
  profile: Profile
  save: (patch: ProfilePatch) => Promise<Profile>
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(profile.about)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    await save({ about: text })
    setOpen(false)
  }

  return (
    <Section
      title="About"
      onEdit={() => {
        setText(profile.about)
        setOpen(true)
      }}
    >
      {profile.about ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-ink-700">
          {profile.about}
        </p>
      ) : (
        <p className="text-sm text-ink-400">
          Add a summary about yourself, your goals, and what you’re learning.
        </p>
      )}

      <Modal open={open} title="Edit about" onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="space-y-4">
          <Textarea
            label="About"
            rows={7}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tell your story…"
          />
          <div className="flex justify-end">
            <PrimaryButton type="submit">Save</PrimaryButton>
          </div>
        </form>
      </Modal>
    </Section>
  )
}
