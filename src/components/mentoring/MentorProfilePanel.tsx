import { useRef, useState } from 'react'
import { Camera, Check, ChevronLeft, Circle, Eye, Loader2, Lock, Trash2, X } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { uploadProfileMedia } from '@/lib/profile'
import { saveMyMentorProfile, setAccepting, type MyMentorProfile } from '@/lib/mentorPortal'
import { MentorListingCard, toMentorListing } from '@/components/community/Marketplace'
import { Alert, Avatar, Button, Field, Input, Textarea } from '@/components/ui'

const LINKEDIN = /^https:\/\/([a-z]+\.)?linkedin\.com\//i
const PHONE = /^[0-9+() -]{7,20}$/
const MAX_AREAS = 10
/** How many areas fit on the card; the rest are in the full profile. */
const AREAS_ON_CARD = 2

/** What a student needs before they can be offered this mentor. Mirrors
 *  public.mentor_missing in docs/supabase-mentor-portal.sql. */
function checklist(f: { headline: string; bio: string; expertise: string[]; linkedin: string; phone: string; avatar: string | null }) {
  // A mentor starts with the placeholder title "Mentor" until they write their own.
  const title = f.headline.trim()
  return [
    { key: 'headline', label: 'Professional title', done: title.length >= 2 && title.toLowerCase() !== 'mentor', required: false },
    { key: 'bio', label: 'About you', done: f.bio.trim().length >= 20, required: true },
    { key: 'expertise', label: 'Areas of expertise', done: f.expertise.length > 0, required: true },
    { key: 'linkedin', label: 'LinkedIn profile', done: LINKEDIN.test(f.linkedin.trim()), required: true },
    { key: 'phone', label: 'Phone number', done: PHONE.test(f.phone.trim()), required: true },
    { key: 'photo', label: 'Profile photo', done: Boolean(f.avatar), required: false },
  ]
}

/** Go to a field from the checklist: scroll it into view and put the cursor in it. */
function focusField(key: string) {
  const box = document.getElementById(`profile-${key}`)
  if (!box) return
  box.scrollIntoView({ behavior: 'smooth', block: 'center' })
  box.querySelector<HTMLElement>('input, textarea, button')?.focus({ preventScroll: true })
}

/**
 * Areas of expertise as tags. Their order is the order students see, and only
 * the first two fit on the card, so a tag can be moved earlier.
 */
function ExpertiseEditor({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const [draft, setDraft] = useState('')
  const full = value.length >= MAX_AREAS

  function add(raw: string) {
    const incoming = raw.split(',').map((s) => s.trim().slice(0, 40)).filter(Boolean)
    if (!incoming.length) return setDraft('')
    const seen = new Set(value.map((v) => v.toLowerCase()))
    const next = [...value]
    for (const t of incoming) {
      if (next.length >= MAX_AREAS || seen.has(t.toLowerCase())) continue
      seen.add(t.toLowerCase())
      next.push(t)
    }
    onChange(next)
    setDraft('')
  }

  const earlier = (i: number) => {
    const next = [...value]
    ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
    onChange(next)
  }

  return (
    <Field
      label="Areas of expertise"
      required
      hint={`Up to ${MAX_AREAS}. The first ${AREAS_ON_CARD} show on your card; all of them show in your full profile.`}
    >
      {value.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {value.map((area, i) => (
            <li
              key={area}
              className={`inline-flex items-center gap-0.5 rounded-full border py-1 pl-1 pr-1 text-xs font-medium ${
                i < AREAS_ON_CARD ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-ink-200 bg-white text-ink-700'
              }`}
            >
              {i > 0 ? (
                <button
                  type="button"
                  onClick={() => earlier(i)}
                  aria-label={`Move ${area} earlier`}
                  title="Move earlier"
                  className="flex h-5 w-5 items-center justify-center rounded-full text-current opacity-60 hover:bg-ink-900/[0.06] hover:opacity-100"
                >
                  <ChevronLeft size={13} />
                </button>
              ) : (
                <span className="w-1.5" />
              )}
              <span className="max-w-[12rem] truncate">{area}</span>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                aria-label={`Remove ${area}`}
                className="flex h-5 w-5 items-center justify-center rounded-full text-current opacity-60 hover:bg-ink-900/[0.06] hover:opacity-100"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        value={draft}
        disabled={full}
        onChange={(e) => (e.target.value.includes(',') ? add(e.target.value) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            add(draft)
          } else if (e.key === 'Backspace' && !draft && value.length) {
            onChange(value.slice(0, -1))
          }
        }}
        onBlur={() => add(draft)}
        maxLength={60}
        aria-label="Add an area of expertise"
        placeholder={full ? `That’s the most you can add (${MAX_AREAS}).` : 'Type one and press Enter, e.g. Interview coaching'}
        className="field"
      />
    </Field>
  )
}

/** The listing as students meet it, built from what is in the form right now. */
function LivePreview({
  listing,
  dirty,
  askable,
}: {
  listing: Parameters<typeof toMentorListing>[0]
  dirty: boolean
  /** In the list students choose from: finished profile, taking students. */
  askable: boolean
}) {
  const [view, setView] = useState<'card' | 'list'>('card')
  return (
    <aside className="order-first self-start lg:sticky lg:top-6 lg:order-none">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
          <Eye size={15} className="text-brand-700" />
          How students see you
        </h2>
        {dirty && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Not saved yet</span>}
      </div>

      <div className="mt-3 inline-flex rounded-full bg-ink-100 p-0.5 text-xs font-semibold" role="tablist" aria-label="Where students see you">
        {(
          [
            ['card', 'Community card'],
            ['list', 'Practice list'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={`rounded-full px-3 py-1.5 transition-colors ${view === id ? 'bg-white text-ink-900 shadow-e1' : 'text-ink-600 hover:text-ink-900'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3">
        {view === 'card' ? (
          <>
            <MentorListingCard mentor={toMentorListing(listing)} preview />
            <p className="mt-2.5 text-xs leading-relaxed text-ink-500">
              This is your real card. Press <span className="font-semibold text-ink-700">View profile</span> on it to see
              your full profile as a student does. The card shows your first {AREAS_ON_CARD} areas and two lines of your
              bio.
            </p>
          </>
        ) : (
          <>
            <div className="card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">Choose a mentor</p>
              <div className={`mt-3 flex items-center gap-3 ${askable ? '' : 'opacity-50'}`}>
                <Avatar name={listing.full_name} src={listing.avatar_url ?? undefined} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">{listing.full_name}</p>
                  <p className="truncate text-xs text-ink-500">{listing.headline}</p>
                </div>
                <span className="rounded-full border border-ink-200 px-3 py-1.5 text-xs font-semibold text-ink-700">Ask</span>
              </div>
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-ink-500">
              {askable
                ? 'Where a student picks who to ask, in Practice. Only your photo, name and title fit here, so make the title count.'
                : 'You aren’t in this list right now: it only shows mentors with a finished profile who are taking new students.'}
            </p>
          </>
        )}
      </div>
    </aside>
  )
}

/**
 * A mentor's own page: shape the listing students see, with the real card
 * beside the form as they type, add a private phone number, and choose whether
 * to take new requests. Students are only offered a mentor whose required
 * items are done.
 */
export function MentorProfilePanel({ profile, onSaved }: { profile: MyMentorProfile; onSaved: () => void }) {
  const [headline, setHeadline] = useState(profile.headline)
  const [bio, setBio] = useState(profile.bio)
  const [location, setLocation] = useState(profile.location ?? '')
  const [expertise, setExpertise] = useState<string[]>(profile.expertise)
  const [linkedin, setLinkedin] = useState(profile.linkedin_url ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [avatar, setAvatar] = useState<string | null>(profile.avatar_url)

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [togglingAccept, setTogglingAccept] = useState(false)
  const [error, setError] = useState<string>()
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const items = checklist({ headline, bio, expertise, linkedin, phone, avatar })
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

  // Against what is saved, so the preview can say when it is ahead of it.
  const dirty =
    headline.trim() !== profile.headline ||
    bio.trim() !== profile.bio ||
    location.trim() !== (profile.location ?? '') ||
    expertise.join('\n') !== profile.expertise.join('\n') ||
    linkedin.trim() !== (profile.linkedin_url ?? '') ||
    phone.trim() !== (profile.phone ?? '') ||
    avatar !== profile.avatar_url

  function reset() {
    setHeadline(profile.headline)
    setBio(profile.bio)
    setLocation(profile.location ?? '')
    setExpertise(profile.expertise)
    setLinkedin(profile.linkedin_url ?? '')
    setPhone(profile.phone ?? '')
    setAvatar(profile.avatar_url)
    setError(undefined)
    setSaved(false)
  }

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
        expertise,
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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-5">
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
                <li key={i.key}>
                  {/* A missing item takes you to its field. */}
                  <button
                    type="button"
                    onClick={() => focusField(i.key)}
                    className="flex items-center gap-2 text-left text-sm hover:underline"
                  >
                    {i.done ? (
                      <Check size={15} className="shrink-0 text-emerald-600" />
                    ) : (
                      <Circle size={15} className="shrink-0 text-ink-300" />
                    )}
                    <span className={i.done ? 'text-ink-500' : 'font-medium text-ink-900'}>{i.label}</span>
                    {!i.required && !i.done && <span className="text-xs text-ink-400">recommended</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-ink-900">What students see</h2>
          <p className="mt-0.5 text-sm text-ink-600">
            Your card in Community and the list students choose from. The preview updates as you type.
          </p>

          <div id="profile-photo" className="mt-5 flex items-center gap-4">
            <Avatar name={profile.full_name} src={avatar ?? undefined} size={72} />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 font-display text-lg font-semibold text-ink-900">
                <span className="truncate">{profile.full_name}</span>
                <Lock size={13} className="shrink-0 text-ink-400" aria-hidden />
              </p>
              <p className="text-xs text-ink-500">Your name is the one the team verified. Ask us if it needs changing.</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void pickPhoto(e.target.files?.[0])}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={uploading ? Loader2 : Camera}
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? 'Uploading…' : avatar ? 'Change photo' : 'Add a photo'}
                </Button>
                {avatar && !uploading && (
                  <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setAvatar(null)}>
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs text-ink-500">A clear, square photo of your face works best. It is cropped to a circle.</p>

          <div className="mt-5 space-y-5">
            <div id="profile-headline">
              <Input
                label="Professional title"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                error={errors.headline}
                hint={`Shown under your name everywhere. ${headline.trim().length}/120`}
                maxLength={120}
                placeholder="e.g. Communicative English Trainer"
              />
            </div>
            <div id="profile-bio">
              <Textarea
                label="About you"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                error={errors.bio}
                hint={`Open with your strongest line: only the first two lines show on the card. ${bio.trim().length}/1200`}
                rows={5}
                maxLength={1200}
                placeholder="Your background, who you like to work with, and how you mentor."
              />
            </div>
            <div id="profile-expertise">
              <ExpertiseEditor value={expertise} onChange={setExpertise} />
            </div>
            <Input
              label="Location"
              required={false}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={80}
              placeholder="e.g. Kochi, India"
            />
            <div id="profile-linkedin">
              <Input
                label="LinkedIn profile"
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                error={errors.linkedin}
                hint="The Connect on LinkedIn button in your full profile opens this."
                placeholder="https://www.linkedin.com/in/your-name"
              />
            </div>
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
            <Lock size={16} className="text-ink-500" /> How we reach you
          </h2>
          <p className="mt-0.5 text-sm text-ink-600">Private — never shown on your public card.</p>
          <div className="mt-5 space-y-5">
            <div id="profile-phone">
              <Input
                label="Phone number"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={errors.phone}
                placeholder="+91 98765 43210"
              />
            </div>
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

        {/* Stays in reach however far down the form they are. */}
        <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-ink-900/[0.08] bg-white/95 p-3 shadow-e2 backdrop-blur">
          <Button disabled={saving || uploading || hasErrors || !dirty} onClick={() => void save()}>
            {saving ? 'Saving…' : 'Save profile'}
          </Button>
          {dirty && (
            <Button variant="ghost" disabled={saving} onClick={reset}>
              Discard changes
            </Button>
          )}
          <span className="text-sm">
            {hasErrors ? (
              <span className="text-red-600">Fix the highlighted fields to save.</span>
            ) : dirty ? (
              <span className="text-amber-700">You have changes that aren’t saved.</span>
            ) : saved ? (
              <span className="font-medium text-emerald-700">Saved. Students see this now.</span>
            ) : (
              <span className="text-ink-500">Everything is saved.</span>
            )}
          </span>
        </div>
      </div>

      <LivePreview
        dirty={dirty}
        askable={live}
        listing={{
          id: profile.id,
          full_name: profile.full_name,
          headline: headline.trim() || 'Your professional title',
          avatar_url: avatar,
          location: location.trim() || null,
          expertise,
          bio: bio.trim(),
          linkedin_url: LINKEDIN.test(linkedin.trim()) ? linkedin.trim() : null,
          accepting: profile.accepting,
        }}
      />
    </div>
  )
}
