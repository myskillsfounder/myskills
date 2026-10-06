import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Save, Trash2, X } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import {
  BIO_MAX,
  BIO_MIN,
  fetchMentorDetails,
  mentorFormProblem,
  saveMentor,
  uploadMentorPhoto,
  type MentorFormInput,
} from '@/lib/adminMentors'
import { Alert, Avatar, Button, Input, Skeleton, Textarea } from '@/components/ui'

const EMPTY: MentorFormInput = {
  full_name: '',
  headline: '',
  bio: '',
  location: '',
  expertise: '',
  linkedin: '',
  phone: '',
  avatar: '',
}

/**
 * The form for a mentor's profile: everything students see (name, title, bio,
 * skills, LinkedIn, photo) and the private phone number. `mentorId` null adds a
 * new mentor. Used to set up mentors who haven't signed up to MySkills; a
 * mentor who has an account keeps managing their own profile in the Community
 * portal, and says so here.
 */
export function MentorEditor({
  mentorId,
  onSaved,
  onCancel,
}: {
  mentorId: string | null
  onSaved: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<MentorFormInput>(EMPTY)
  const [linked, setLinked] = useState(false)
  const [loading, setLoading] = useState(mentorId !== null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string>()
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (mentorId === null) return
    let active = true
    fetchMentorDetails(mentorId)
      .then((d) => {
        if (!active || !d) return
        setLinked(d.linked)
        setForm({
          full_name: d.full_name,
          headline: d.headline,
          bio: d.bio,
          location: d.location ?? '',
          expertise: d.expertise.join(', '),
          linkedin: d.linkedin_url ?? '',
          phone: d.phone ?? '',
          avatar: d.avatar_url ?? '',
        })
      })
      .catch((e) => active && setError(errorMessage(e)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [mentorId])

  const set = (key: keyof MentorFormInput) => (value: string) => setForm((f) => ({ ...f, [key]: value }))
  const problem = mentorFormProblem(form)
  const bioLength = form.bio.trim().length

  async function pickPhoto(file: File | undefined) {
    if (!file) return
    setUploading(true)
    setError(undefined)
    try {
      set('avatar')(await uploadMentorPhoto(file))
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function save() {
    setSaving(true)
    setError(undefined)
    try {
      await saveMentor(mentorId, form)
      onSaved()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Skeleton className="mt-4 h-64 w-full" />

  return (
    <div className="mt-4 rounded-2xl border border-ink-900/[0.08] bg-ink-50/60 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-ink-900">
          {mentorId ? 'Edit profile' : 'Add a mentor'}
        </h3>
        <button type="button" onClick={onCancel} aria-label="Cancel" className="rounded-full p-1.5 text-ink-500 hover:bg-ink-100">
          <X size={16} />
        </button>
      </div>

      {linked && (
        <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
          This mentor has a MySkills account, so they manage their own profile in the Community portal. What you save here
          is what the listing holds; their own profile can still show over it on the Community page.
        </p>
      )}

      <div className="mt-4 flex items-center gap-4">
        <Avatar name={form.full_name || '?'} src={form.avatar || undefined} size={64} />
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label="Upload a photo"
            onChange={(e) => void pickPhoto(e.target.files?.[0])}
          />
          <Button size="sm" variant="secondary" icon={ImagePlus} disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? 'Uploading…' : form.avatar ? 'Change photo' : 'Add a photo'}
          </Button>
          {form.avatar && (
            <Button size="sm" variant="secondary" icon={Trash2} onClick={() => set('avatar')('')}>
              Remove
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Input label="Full name" value={form.full_name} onChange={(e) => set('full_name')(e.target.value)} maxLength={80} />
        <Input
          label="Title"
          hint="Shown under their name, like “SEO Lead”."
          value={form.headline}
          onChange={(e) => set('headline')(e.target.value)}
          maxLength={120}
        />
        <Input
          label="Location"
          required={false}
          value={form.location}
          onChange={(e) => set('location')(e.target.value)}
          maxLength={80}
          placeholder="Kochi, Kerala"
        />
        <Input
          label="Skills"
          required={false}
          hint="Separate with commas, up to 10."
          value={form.expertise}
          onChange={(e) => set('expertise')(e.target.value)}
          placeholder="SEO, Google Ads, Analytics"
        />
      </div>

      <div className="mt-4">
        <Textarea
          label="Bio"
          hint={`${BIO_MIN}–${BIO_MAX} characters. This is what students read.`}
          value={form.bio}
          onChange={(e) => set('bio')(e.target.value)}
          rows={5}
        />
        <p className={`mt-1 text-xs tabular-nums ${bioLength > BIO_MAX ? 'text-red-700' : 'text-ink-500'}`}>
          {bioLength} / {BIO_MAX}
        </p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Input
          label="LinkedIn"
          required={false}
          value={form.linkedin}
          onChange={(e) => set('linkedin')(e.target.value)}
          placeholder="https://www.linkedin.com/in/their-name"
        />
        <Input
          label="Phone (private)"
          required={false}
          hint="Only staff and the mentor see this."
          value={form.phone}
          onChange={(e) => set('phone')(e.target.value)}
          placeholder="+91 98470 12345"
        />
      </div>

      <p className="mt-3 text-xs text-ink-500">
        Students are only offered a mentor who has a bio, skills, a LinkedIn link and a phone number, and a linked
        MySkills account. Anything missing just keeps them out of that list.
      </p>

      {error && (
        <div className="mt-3">
          <Alert tone="danger" title="Couldn’t save">
            <p>{error}</p>
          </Alert>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button icon={Save} disabled={saving || uploading || problem !== null} onClick={() => void save()}>
          {saving ? 'Saving…' : mentorId ? 'Save changes' : 'Add mentor'}
        </Button>
        <button type="button" onClick={onCancel} className="text-sm font-medium text-ink-600 hover:text-ink-900">
          Cancel
        </button>
        {problem && <span className="text-xs text-ink-500">{problem}</span>}
      </div>
    </div>
  )
}
