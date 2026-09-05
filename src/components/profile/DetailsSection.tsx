/**
 * Personal details on the profile page.
 *
 * These used to be step 1 of onboarding. Sign-up now only asks for career
 * stage + goals, and everything personal is collected here instead — as
 * profile completion, at the user's own pace.
 */
import { useState } from 'react'
import { BookOpen, Cake, MapPin, Phone, Target, UserRound } from 'lucide-react'
import type { ComponentType } from 'react'
import type { Profile, ProfilePatch } from '@/lib/profile'
import {
  careerStageStep,
  genderOptions,
  goalsStep,
  personalDetailsForm,
} from '@/lib/onboardingContent'
import { Field, Modal, PrimaryButton, Section, Select } from './ui'

type IconType = ComponentType<{ size?: number; className?: string }>

const f = personalDetailsForm.fields

const goalLabel = (id: string) => goalsStep.options.find((o) => o.id === id)?.label ?? id
const careerLabel = (id: string) =>
  careerStageStep.options.find((o) => o.id === id)?.title ?? id
const genderLabel = (v: string) => genderOptions.find((o) => o.value === v)?.label ?? v

const formatDob = (iso: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

/* ----------------------------------------------------------- completeness */

export interface DetailItem {
  key: keyof Pick<Profile, 'phone' | 'date_of_birth' | 'gender' | 'country' | 'state'>
  label: string
}

export const DETAIL_ITEMS: DetailItem[] = [
  { key: 'phone', label: f.phone.label },
  { key: 'date_of_birth', label: f.dob.label },
  { key: 'gender', label: f.gender.label },
  { key: 'country', label: f.country.label },
  { key: 'state', label: f.state.label },
]

/** Which personal details are still blank. */
export function missingDetails(profile: Profile): DetailItem[] {
  return DETAIL_ITEMS.filter((i) => !String(profile[i.key] ?? '').trim())
}

/* ---------------------------------------------------------------- editing */

interface DetailsDraft {
  phone: string
  date_of_birth: string
  gender: string
  country: string
  state: string
}

const draftFrom = (p: Profile): DetailsDraft => ({
  phone: p.phone ?? '',
  date_of_birth: p.date_of_birth ?? '',
  gender: p.gender ?? '',
  country: p.country || f.country.default,
  state: p.state || f.state.default,
})

/** Shared edit dialog — opened from the Details card and from the nudge card. */
export function PersonalDetailsModal({
  open,
  profile,
  save,
  onClose,
}: {
  open: boolean
  profile: Profile
  save: (patch: ProfilePatch) => Promise<Profile>
  onClose: () => void
}) {
  const [draft, setDraft] = useState<DetailsDraft>(() => draftFrom(profile))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  // Re-seed the draft each time the dialog opens so it always reflects saved data.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setDraft(draftFrom(profile))
      setError(undefined)
    }
  }

  function set<K extends keyof DetailsDraft>(key: K, value: string) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  async function submit() {
    setSaving(true)
    setError(undefined)
    try {
      // Only seed the header's location when the user hasn't set one — it is
      // freely editable up there and shouldn't be overwritten from here.
      const location = profile.location
        ? ''
        : [draft.state, draft.country].filter(Boolean).join(', ')
      await save({
        phone: draft.phone.trim(),
        // A blank date column must stay null, not ''.
        date_of_birth: draft.date_of_birth || null,
        gender: draft.gender,
        country: draft.country.trim(),
        state: draft.state.trim(),
        ...(location ? { location } : {}),
      })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your details.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} title={personalDetailsForm.title} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-ink-600">{personalDetailsForm.subtitle}</p>

        <Field
          label={f.phone.label}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={f.phone.placeholder}
          value={draft.phone}
          onChange={(e) => set('phone', e.target.value)}
        />
        <Field
          label={f.dob.label}
          type="date"
          value={draft.date_of_birth}
          onChange={(e) => set('date_of_birth', e.target.value)}
        />
        <Select
          label={f.gender.label}
          placeholder={f.gender.placeholder}
          options={genderOptions}
          value={draft.gender}
          onChange={(e) => set('gender', e.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={f.country.label}
            placeholder={f.country.placeholder}
            value={draft.country}
            onChange={(e) => set('country', e.target.value)}
          />
          <Field
            label={f.state.label}
            placeholder={f.state.placeholder}
            value={draft.state}
            onChange={(e) => set('state', e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end pt-1">
          <PrimaryButton onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : 'Save details'}
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------- nudge card */

/**
 * Sits under the profile header until every personal detail is filled in.
 * This is the replacement for the old onboarding step — same questions, but
 * asked once someone is already inside the product.
 */
export function ProfileCompletion({
  profile,
  save,
}: {
  profile: Profile
  save: (patch: ProfilePatch) => Promise<Profile>
}) {
  const [open, setOpen] = useState(false)
  const missing = missingDetails(profile)
  if (!missing.length) return null

  const done = DETAIL_ITEMS.length - missing.length
  const percent = Math.round((done / DETAIL_ITEMS.length) * 100)

  return (
    <>
      <section className="card border-brand-200 bg-brand-50 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink-900 sm:text-lg">
              Complete your profile
            </h2>
            <p className="mt-1 text-sm text-ink-600">
              Add {missing.map((m) => m.label.toLowerCase()).join(', ')} so we can
              personalize your tracks and your certificate.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="press h-11 shrink-0 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-brand-700"
          >
            Add details
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-200">
            <span
              className="block h-full rounded-full bg-brand-600 transition-[width] duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="shrink-0 text-xs font-medium text-ink-600">
            {done} of {DETAIL_ITEMS.length}
          </p>
        </div>
      </section>

      <PersonalDetailsModal
        open={open}
        profile={profile}
        save={save}
        onClose={() => setOpen(false)}
      />
    </>
  )
}

/* ------------------------------------------------------------ details card */

function DetailRow({ icon: Icon, label, value }: { icon: IconType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-600">
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-ink-500">{label}</p>
        <p className="truncate text-sm font-medium text-ink-900">{value || '—'}</p>
      </div>
    </div>
  )
}

export function DetailsSection({
  profile,
  save,
}: {
  profile: Profile
  save: (patch: ProfilePatch) => Promise<Profile>
}) {
  const [open, setOpen] = useState(false)
  const location = [profile.state, profile.country].filter(Boolean).join(', ')

  return (
    <Section title="Details" onEdit={() => setOpen(true)}>
      <div className="space-y-4">
        <DetailRow
          icon={Target}
          label="Career stage"
          value={profile.career_stage ? careerLabel(profile.career_stage) : '—'}
        />
        <DetailRow icon={MapPin} label="Location" value={location} />
        <DetailRow icon={Phone} label={f.phone.label} value={profile.phone} />
        <DetailRow icon={Cake} label={f.dob.label} value={formatDob(profile.date_of_birth)} />
        <DetailRow
          icon={UserRound}
          label={f.gender.label}
          value={profile.gender ? genderLabel(profile.gender) : ''}
        />
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <BookOpen size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-ink-500">Focus areas</p>
            {profile.goals.length ? (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {profile.goals.map((id) => (
                  <span
                    key={id}
                    className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
                  >
                    {goalLabel(id)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium text-ink-900">—</p>
            )}
          </div>
        </div>
      </div>

      <PersonalDetailsModal
        open={open}
        profile={profile}
        save={save}
        onClose={() => setOpen(false)}
      />
    </Section>
  )
}
