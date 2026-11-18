import { useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Camera, Check, ExternalLink, Loader2, Plus } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import type { Profile, ProfilePatch } from '@/lib/profile'

/*
 * How strong an internship application is, from the profile that goes with it
 * (Paul, 18 Nov 2026: "nudge users to complete profile to make a good
 * application"). The quick things (photo, phone, headline, skills) are filled
 * in right here, so the CV they chose isn't lost by leaving the form; the
 * longer ones (education, experience) open the profile in a new tab.
 */

type Key = 'photo' | 'phone' | 'headline' | 'skills' | 'education' | 'experience'

interface Item {
  key: Key
  label: string
  why: string
  done: boolean
}

const SKILLS_WANTED = 3

function strengthItems(p: Profile): Item[] {
  return [
    { key: 'phone', label: 'Phone number', why: 'so the company can call you', done: p.phone.trim().length > 0 },
    { key: 'headline', label: 'A headline', why: 'one line on who you are', done: p.headline.trim().length > 0 },
    { key: 'skills', label: `${SKILLS_WANTED} or more skills`, why: 'what you can do', done: p.skills.length >= SKILLS_WANTED },
    { key: 'photo', label: 'A photo', why: 'a face to the name', done: Boolean(p.avatar_url) },
    { key: 'education', label: 'Your education', why: 'where you study', done: p.education.length > 0 },
    { key: 'experience', label: 'Experience or a project', why: 'work you can show', done: p.experience.length > 0 || p.projects.length > 0 },
  ]
}

function Meter({ done, total }: { done: number; total: number }) {
  const full = done === total
  const word = full ? 'Strong' : done >= total - 2 ? 'Good' : 'Needs work'
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-ink-900">Application strength</p>
        <p className={`text-sm font-semibold ${full ? 'text-emerald-700' : 'text-amber-700'}`}>
          {word} · {done} of {total}
        </p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-900/[0.06]">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${full ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-400 to-emerald-500'}`}
          style={{ width: `${Math.round((done / total) * 100)}%` }}
        />
      </div>
    </div>
  )
}

const field =
  'min-w-0 flex-1 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200'
const saveBtn =
  'press inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50'

/** One line of profile to fill in, saved straight to the profile. */
function QuickText({
  placeholder,
  type = 'text',
  check,
  onSave,
}: {
  placeholder: string
  type?: string
  check?: (v: string) => string | null
  onSave: (v: string) => Promise<void>
}) {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function save() {
    const v = value.trim()
    const problem = !v ? 'Type it in first.' : check?.(v) ?? null
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    setError('')
    try {
      await onSave(v)
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }
  return (
    <div className="mt-2">
      <div className="flex gap-2">
        <input
          type={type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), void save())}
          placeholder={placeholder}
          className={field}
        />
        <button type="button" disabled={busy} onClick={() => void save()} className={saveBtn}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

const phoneProblem = (v: string) =>
  v.replace(/\D/g, '').length < 10 || /[^\d\s+()-]/.test(v) ? 'That doesn’t look like a phone number.' : null

function ItemRow({
  item,
  profile,
  suggested,
  save,
  upload,
}: {
  item: Item
  profile: Profile
  suggested: string[]
  save: (patch: ProfilePatch) => Promise<unknown>
  upload: (file: File, kind: 'avatar' | 'banner') => Promise<string>
}) {
  const photoRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function run(fn: () => Promise<unknown>) {
    setBusy(true)
    setError('')
    try {
      await fn()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const toAdd = suggested.filter((s) => !profile.skills.some((k) => k.toLowerCase() === s.toLowerCase()))

  return (
    <li className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
      <p className="text-sm text-ink-900">
        <span className="font-semibold">{item.label}</span> <span className="text-ink-600">· {item.why}</span>
      </p>

      {item.key === 'phone' && (
        <QuickText type="tel" placeholder="e.g. +91 98765 43210" check={phoneProblem} onSave={(v) => save({ phone: v }).then(() => undefined)} />
      )}
      {item.key === 'headline' && (
        <QuickText placeholder="e.g. BBA student, keen on digital marketing" onSave={(v) => save({ headline: v.slice(0, 120) }).then(() => undefined)} />
      )}
      {item.key === 'skills' && (
        <div className="mt-2">
          {toAdd.length > 0 && <p className="text-xs text-ink-600">Tap the ones you have:</p>}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {toAdd.map((s) => (
              <button
                key={s}
                type="button"
                disabled={busy}
                onClick={() => void run(() => save({ skills: [...profile.skills, s] }))}
                className="press inline-flex items-center gap-1 rounded-full border border-brand-300 bg-white px-2.5 py-1 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-50 disabled:opacity-50"
              >
                <Plus size={12} /> {s}
              </button>
            ))}
            <Link to="/profile" target="_blank" className="inline-flex items-center gap-1 px-1 py-1 text-xs font-semibold text-ink-700 underline underline-offset-2">
              Add others <ExternalLink size={11} />
            </Link>
          </div>
        </div>
      )}
      {item.key === 'photo' && (
        <div className="mt-2">
          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label="Choose a photo"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void run(async () => save({ avatar_url: await upload(f, 'avatar') }))
            }}
          />
          <button type="button" disabled={busy} onClick={() => photoRef.current?.click()} className={saveBtn}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />} Add a photo
          </button>
        </div>
      )}
      {(item.key === 'education' || item.key === 'experience') && (
        <Link
          to="/profile"
          target="_blank"
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 underline underline-offset-2"
        >
          Add it on my profile <ExternalLink size={12} />
        </Link>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </li>
  )
}

/**
 * The profile that goes with the application, how strong it is, and what to
 * add. `compact` after sending: just the meter and a nudge, since anything
 * added later still goes with the application (the team reads the profile as
 * it is when they share it).
 */
export function ApplicationStrength({
  profile,
  save,
  upload,
  suggestedSkills,
  compact = false,
}: {
  profile: Profile
  save: (patch: ProfilePatch) => Promise<unknown>
  upload: (file: File, kind: 'avatar' | 'banner') => Promise<string>
  suggestedSkills: string[]
  compact?: boolean
}) {
  const items = strengthItems(profile)
  const done = items.filter((i) => i.done)
  const missing = items.filter((i) => !i.done)
  const name = profile.full_name.trim() || 'You'

  if (compact) {
    if (missing.length === 0) return null
    return (
      <div className="mt-5 rounded-2xl border border-ink-200 p-4 text-left">
        <Meter done={done.length} total={items.length} />
        <p className="mt-3 text-sm leading-relaxed text-ink-700">
          Make it stronger: add {missing.map((m) => m.label.toLowerCase()).join(', ')}. Your profile goes with your application, so
          anything you add now still counts.
        </p>
        <Link to="/profile" className="press mt-3 inline-flex h-10 items-center rounded-xl border border-ink-300 px-4 text-sm font-semibold text-ink-800 hover:bg-ink-100">
          Complete My Profile
        </Link>
      </div>
    )
  }

  return (
    <div className="mt-6 rounded-2xl border border-ink-200 p-4">
      <Meter done={done.length} total={items.length} />

      <div className="mt-4 flex items-center gap-3">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-semibold text-white">
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink-900">{name}</p>
          <p className="truncate text-sm text-ink-600">{[profile.headline, profile.location].filter((x) => x.trim()).join(' · ') || 'No headline yet'}</p>
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-ink-500">
        Your profile, progress and Global Readiness Score go with your application.
      </p>

      {missing.length === 0 ? (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          <Check size={15} strokeWidth={3} /> Your profile is complete. A company sees the whole picture.
        </p>
      ) : (
        <>
          <p className="mt-4 text-sm font-semibold text-ink-900">Add these to stand out</p>
          <ul className="mt-2 space-y-2">
            {missing.map((item) => (
              <ItemRow key={item.key} item={item} profile={profile} suggested={suggestedSkills} save={save} upload={upload} />
            ))}
          </ul>
        </>
      )}

      {done.length > 0 && missing.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {done.map((i) => (
            <li key={i.key} className="inline-flex items-center gap-1 text-xs text-emerald-700">
              <Check size={12} strokeWidth={3} /> {i.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
