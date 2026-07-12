import { useRef, useState } from 'react'
import { Camera, MapPin, Pencil } from 'lucide-react'
import type { Profile, ProfilePatch } from '@/lib/profile'
import { Field, Modal, PrimaryButton } from './ui'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
}

export function ProfileHeader({
  profile,
  save,
  upload,
}: {
  profile: Profile
  save: (patch: ProfilePatch) => Promise<Profile>
  upload: (file: File, kind: 'avatar' | 'banner') => Promise<string>
}) {
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState<'avatar' | 'banner' | null>(null)
  const [form, setForm] = useState({
    full_name: profile.full_name,
    headline: profile.headline,
    location: profile.location,
  })
  const avatarInput = useRef<HTMLInputElement>(null)
  const bannerInput = useRef<HTMLInputElement>(null)

  async function handleFile(kind: 'avatar' | 'banner', file?: File) {
    if (!file) return
    setBusy(kind)
    try {
      const url = await upload(file, kind)
      await save(kind === 'avatar' ? { avatar_url: url } : { banner_url: url })
    } finally {
      setBusy(null)
    }
  }

  async function saveIntro(e: React.FormEvent) {
    e.preventDefault()
    await save(form)
    setEditing(false)
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
      {/* Banner */}
      <div className="relative h-36 sm:h-48">
        {profile.banner_url ? (
          <img
            src={profile.banner_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-violet-500 via-brand-600 to-fuchsia-500" />
        )}
        <button
          type="button"
          onClick={() => bannerInput.current?.click()}
          disabled={busy === 'banner'}
          aria-label="Change banner"
          className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-ink-800 shadow hover:bg-white disabled:opacity-60"
        >
          <Camera size={14} />
          {busy === 'banner' ? 'Uploading…' : 'Banner'}
        </button>
        <input
          ref={bannerInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile('banner', e.target.files?.[0])}
        />
      </div>

      {/* Avatar + intro */}
      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="-mt-12 flex items-end justify-between sm:-mt-16">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-brand-100 text-2xl font-semibold text-brand-700 sm:h-32 sm:w-32">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials(profile.full_name)
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInput.current?.click()}
              disabled={busy === 'avatar'}
              aria-label="Change photo"
              className="absolute bottom-1 right-1 rounded-full bg-white p-1.5 text-ink-700 shadow ring-1 ring-ink-100 hover:text-ink-900 disabled:opacity-60"
            >
              <Camera size={16} />
            </button>
            <input
              ref={avatarInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile('avatar', e.target.files?.[0])}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setForm({
                full_name: profile.full_name,
                headline: profile.headline,
                location: profile.location,
              })
              setEditing(true)
            }}
            aria-label="Edit intro"
            className="rounded-full p-2 text-ink-500 hover:bg-ink-50 hover:text-ink-900"
          >
            <Pencil size={18} />
          </button>
        </div>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink-900">
          {profile.full_name || 'Your name'}
        </h1>
        {profile.headline && (
          <p className="mt-1 text-sm text-ink-700">{profile.headline}</p>
        )}
        {profile.location && (
          <p className="mt-1.5 inline-flex items-center gap-1 text-sm text-ink-500">
            <MapPin size={14} />
            {profile.location}
          </p>
        )}
      </div>

      <Modal open={editing} title="Edit intro" onClose={() => setEditing(false)}>
        <form onSubmit={saveIntro} className="space-y-4">
          <Field
            label="Name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
          <Field
            label="Headline"
            placeholder="e.g. Aspiring digital marketer · SEO & Google Ads"
            value={form.headline}
            onChange={(e) => setForm({ ...form, headline: e.target.value })}
          />
          <Field
            label="Location"
            placeholder="e.g. Kochi, Kerala"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <div className="flex justify-end pt-2">
            <PrimaryButton type="submit">Save</PrimaryButton>
          </div>
        </form>
      </Modal>
    </section>
  )
}
