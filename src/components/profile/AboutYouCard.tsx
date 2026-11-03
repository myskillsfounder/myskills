import { useState } from 'react'
import { Check, Pencil } from 'lucide-react'
import type { Profile, ProfilePatch } from '@/lib/profile'
import { careerStageLabel, careerStageStep, goalLabel, goalsFor } from '@/lib/onboardingContent'
import { PrimaryButton, Select } from './ui'

/**
 * Where the student is and the one goal they're working towards: what the
 * onboarding questions used to ask before anything else. Since 3 Nov 2026 a
 * student signs in and goes straight to Study rooms (Paul), so these are
 * optional, here. A mentor, a career guide and the team still read them.
 */
export function AboutYouCard({ profile, save }: { profile: Profile; save: (patch: ProfilePatch) => Promise<Profile> }) {
  const savedStage = profile.career_stage ?? ''
  const savedGoal = profile.goals[0] ?? ''
  const [editing, setEditing] = useState(!savedStage || !savedGoal)
  const [stage, setStage] = useState(savedStage)
  const [goal, setGoal] = useState(savedGoal)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  const goals = goalsFor(stage)

  function pickStage(id: string) {
    setStage(id)
    // A goal the new stage isn't offered no longer fits: ask again.
    if (goal && !goalsFor(id).some((g) => g.id === goal)) setGoal('')
  }

  async function submit() {
    setSaving(true)
    setError(undefined)
    try {
      await save({ career_stage: stage, goals: goal ? [goal] : [] })
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <section className="card flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-ink-900">About you</h2>
          <p className="mt-1 text-sm text-ink-600">
            {careerStageLabel(savedStage)} · Goal: {goalLabel(savedGoal)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          <Pencil size={14} /> Change
        </button>
      </section>
    )
  }

  return (
    <section className="card p-5 sm:p-6">
      <h2 className="text-base font-semibold text-ink-900">About you</h2>
      <p className="mt-1 text-sm text-ink-600">
        Optional. It helps your mentor and career guide know where you’re starting from.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Select
          label="Where you are right now"
          placeholder="Choose one"
          value={stage}
          onChange={(e) => pickStage(e.target.value)}
          options={careerStageStep.options.map((o) => ({ value: o.id, label: o.label }))}
        />
        <Select
          label="The one goal you’re working towards"
          placeholder="Choose one"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          options={goals.map((g) => ({ value: g.id, label: g.label }))}
        />
      </div>
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      <div className="mt-4 flex items-center gap-3">
        <PrimaryButton type="button" onClick={() => void submit()} disabled={saving || (!stage && !goal)}>
          {saving ? 'Saving…' : (
            <span className="inline-flex items-center gap-1.5">
              <Check size={15} /> Save
            </span>
          )}
        </PrimaryButton>
        {savedStage && savedGoal && (
          <button type="button" onClick={() => setEditing(false)} className="text-sm font-medium text-ink-600 hover:text-ink-900">
            Cancel
          </button>
        )}
      </div>
    </section>
  )
}
