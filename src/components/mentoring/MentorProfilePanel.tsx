import { useRef, useState } from 'react'
import { Camera, Check, Circle, Loader2, Lock } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { uploadProfileMedia } from '@/lib/profile'
import { saveMyMentorProfile, setAccepting, type MyMentorProfile } from '@/lib/mentorPortal'
import { Alert, Avatar, Button, Input, Textarea } from '@/components/ui'

const LINKEDIN = /^https:\/\/([a-z]+\.)?linkedin\.com\//i
const PHONE = /^[0-9+() -]{7,20}$/

const parseExpertise = (raw: string) =>
  Array.from(new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))).slice(0, 10)

/** What a student needs before they can be offered this mentor. Mirrors
 *  public.mentor_missing in docs/supabase-mentor-portal.sql. */
function checklist(f: { bio: string; expertise: string; linkedin: string; phone: string; avatar: string | null }) {
  return [
    { key: 'bio', label: 'About you', done: f.bio.trim().length >= 20, required: true },
    { key: 'expertise', label: 'Areas of expertise', done: parseExpertise(f.expertise).length > 0, required: true },
    { key: 'linkedin', label: 'LinkedIn profile', done: LINKEDIN.test(f.linkedin.trim()), required: true },
    { key: 'phone', label: 'Phone number', done: PHONE.test(f.phone.trim()), required: true },
    { key: 'photo', label: 'Profile photo', done: Boolean(f.avatar), required: false },
  ]
}

/**
 * A mentor's own page: finish the listing students see, add a private phone
 * number, and choose whether to take new requests. Students are only offered
 * a mentor whose required items are done.
 */
export function MentorProfilePanel({ profile, onSaved }: { profile: MyMentorProfile; onSaved: () => void }) {
  const [headline, setHeadline] = useState(profile.headline)
  const [bio, setBio] = useState(profile.bio)
  const [location, setLocation] = useState(profile.location ?? '')
  const [expertise, setExpertise] = useState(profile.expertise.join(', '))
  const [linkedin, setLinkedin] = useState(profile.linkedin_url ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [avatar, setAvatar] = useState<string | null>(profile.avatar_url)

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [togglingAccept, setTogglingAccept] = useState(false)
  const [error, setError] = useState<string>()
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const items = checklist({ bio, expertise, linkedin, phone, avatar })
  const required = items.filter((i) => i.required)
  const doneCount = required.filter((i) => i.done).length
  const complete = doneCount === required.length

  const errors = {
    headline: headline.trim().length < 2 ? 'A short professional title.' : undefined,
    bio: bio.trim().length < 20 ? 'Tell students a little more — at least 20 characters.' : undefined,
    linkedin:
      linkedin.trim() && !LINKEDIN.test(linkedin.trim()) ? 'Should look like https://www.linkedin.com/in/your-name' : undefined,
    phone: phone.trim() && !PHONE.test(phone.trim()) ? 'Digits, spaces, + or - only.' : undefined,
  }
  const hasErrors = Object.values(errors).some(Boolean)

  async function pickPhoto(file: File | undefined) {
    if (!file) return
    setError(undefined)
    if (!file.type.startsWith('image/')) return setError('Choose an image file.')
    if (file.size > 5 * 1024 * 1024) return setError('Choose an image under 5 MB.')
    setUploading(true)
    try {
      setAvatar(await uploadProfileMedia(file, 'avatar'))
      setSaved(false)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function save() {
    if (hasErrors) return
    setSaving(true)
    setError(undefined)
    try {
      await saveMyMentorProfile({
        headline,
        bio,
        location,
        expertise: parseExpertise(expertise),
        linkedin_url: linkedin,
        phone,
        avatar_url: avatar,
      })
      setSaved(true)
      onSaved()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  async function toggleAccepting() {
    setTogglingAccept(true)
    setError(undefined)
    try {
      await setAccepting(!profile.accepting)
      onSaved()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setTogglingAccept(false)
    }
  }

  // Completing the profile is what makes a mentor visible; the switch only
  // pauses requests. It reflects what's saved, so edits that aren't saved
  // yet don't count.
  const canAccept = profile.ready
  const live = canAccept && profile.accepting

  return (
    <div className="space-y-5">
      <section className="card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold text-ink-900">Taking new students</h2>
            <p className="mt-0.5 text-sm text-ink-600">
              {!canAccept
                ? 'Not visible to students yet. Finish and save the items below and they can start asking you.'
                : profile.accepting
                  ? 'Students can ask you to mentor them. Pause this any time — your current students aren’t affected.'
                  : 'You’re paused. Students can’t send you new requests.'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={live}
            aria-label="Taking new students"
            disabled={togglingAccept || !canAccept}
            onClick={() => void toggleAccepting()}
            className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              live ? 'bg-emerald-500' : 'bg-ink-300'
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                live ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        <div className="mt-5 border-t border-ink-200 pt-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink-900">
              Your profile · {doneCount} of {required.length} done
            </p>
            {complete && <span className="text-xs font-semibold text-emerald-700">Ready for students</span>}
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100" role="progressbar" aria-valuemin={0} aria-valuemax={required.length} aria-valuenow={doneCount} aria-label="Profile completion">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-600 transition-[width] duration-500"
              style={{ width: `${(doneCount / required.length) * 100}%` }}
            />
          </div>
          <ul className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {items.map((i) => (
              <li key={i.key} className="flex items-center gap-2 text-sm">
                {i.done ? (
                  <Check size={15} className="shrink-0 text-emerald-600" />
                ) : (
                  <Circle size={15} className="shrink-0 text-ink-300" />
                )}
                <span className={i.done ? 'text-ink-500' : 'text-ink-800'}>{i.label}</span>
                {!i.required && !i.done && <span className="text-xs text-ink-400">recommended</span>}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">What students see</h2>
        <p className="mt-0.5 text-sm text-ink-600">This is your card in Community and in the list students choose from.</p>

        <div className="mt-5 flex items-center gap-4">
          <Avatar name={profile.full_name} src={avatar ?? undefined} size={72} />
          <div>
            <p className="font-display text-lg font-semibold text-ink-900">{profile.full_name}</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void pickPhoto(e.target.files?.[0])}
            />
            <Button
              size="sm"
              variant="secondary"
              icon={uploading ? Loader2 : Camera}
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="mt-1.5"
            >
              {uploading ? 'Uploading…' : avatar ? 'Change photo' : 'Add a photo'}
            </Button>
          </div>
        </div>

        <div className="mt-5 space-y-5">
          <Input
            label="Professional title"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            error={errors.headline}
            maxLength={120}
            placeholder="e.g. Communicative English Trainer"
          />
          <Textarea
            label="About you"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            error={errors.bio}
            rows={4}
            maxLength={1200}
            placeholder="Your background, who you like to work with, and how you mentor."
          />
          <Input
            label="Areas of expertise"
            value={expertise}
            onChange={(e) => setExpertise(e.target.value)}
            hint="Separate with commas — up to 10."
            placeholder="e.g. Communicative English, Interview coaching"
          />
          <Input label="Location" required={false} value={location} onChange={(e) => setLocation(e.target.value)} maxLength={80} />
          <Input
            label="LinkedIn profile"
            type="url"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            error={errors.linkedin}
            placeholder="https://www.linkedin.com/in/your-name"
          />
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
          <Lock size={16} className="text-ink-500" /> How we reach you
        </h2>
        <p className="mt-0.5 text-sm text-ink-600">Private — never shown on your public card.</p>
        <div className="mt-5 space-y-5">
          <Input
            label="Phone number"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
            placeholder="+91 98765 43210"
          />
          <div>
            <p className="text-sm font-medium text-ink-900">Email</p>
            <p className="mt-1 break-all text-sm text-ink-700">{profile.email}</p>
            <p className="mt-0.5 text-xs text-ink-500">The one you sign in with. Student requests are emailed here.</p>
          </div>
        </div>
      </section>

      {error && (
        <Alert tone="danger" title="Couldn’t save that">
          <p>{error}</p>
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={saving || uploading || hasErrors} onClick={() => void save()}>
          {saving ? 'Saving…' : 'Save profile'}
        </Button>
        {saved && !error && <span className="text-sm font-medium text-emerald-700">Saved</span>}
      </div>
    </div>
  )
}
