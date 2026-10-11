import { useEffect, useRef, useState } from 'react'
import { Building2, Camera, Check, Circle, Globe, Loader2, Lock, MapPin, Phone, Trash2, User } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { uploadProfileMedia } from '@/lib/profile'
import { RESOURCE_LABEL, type CommunityAccess } from '@/lib/communityPortal'
import { fetchMyPartnerProfile, saveMyPartnerProfile, type PartnerProfile } from '@/lib/partnerProfile'
import { Alert, Avatar, Button, Input, Skeleton, Textarea } from '@/components/ui'

const PHONE = /^[0-9+() -]{7,20}$/
const LINK = /^https?:\/\/\S+\.\S+$/i

/** Go to a field from the checklist: scroll it into view and put the cursor in it. */
function focusField(key: string) {
  const box = document.getElementById(`partner-${key}`)
  if (!box) return
  box.scrollIntoView({ behavior: 'smooth', block: 'center' })
  box.querySelector<HTMLElement>('input, textarea, button')?.focus({ preventScroll: true })
}

/** The words that differ between a person (a counsellor, a guide) and an
 *  organisation (a company, an institution). */
function wording(access: CommunityAccess[]) {
  const own = access.filter((a) => !a.sees_all)
  const institution = own.some((a) => a.resource === 'institutions')
  const company = own.some((a) => a.resource === 'internships')
  if (institution || company) {
    const kind = institution ? 'institution' : 'company'
    return {
      organisation: true,
      heading: `Your ${kind}`,
      name: institution ? 'Institution name' : 'Company name',
      title: 'What you do, in a line',
      titleHint: institution ? 'e.g. Digital marketing institute with classroom batches' : 'e.g. Performance marketing agency',
      about: `About the ${kind}`,
      aboutHint: institution
        ? 'The courses you run, batch sizes, and what a student can expect.'
        : 'What the company does, the teams interns would join, and the roles you can offer.',
      link: 'Website',
      photo: 'logo',
    }
  }
  const counsellor = own.some((a) => a.resource === 'wellness')
  return {
    organisation: false,
    heading: 'About you',
    name: 'Your name',
    title: 'Professional title',
    titleHint: counsellor ? 'e.g. Counselling Psychologist' : 'e.g. Career Coach, 8 years in hiring',
    about: 'About you',
    aboutHint: counsellor
      ? 'Your qualifications and registration, who you work best with, and how you run a session.'
      : 'Your background, the fields you know, and how you help someone decide what’s next.',
    link: 'LinkedIn or website',
    photo: 'photo',
  }
}

/**
 * The profile of a partner who isn't a mentor: who they are (or the
 * organisation and its contact), what they do, a little about them, and how to
 * reach them. The MySkills team reads it to introduce a student to the right
 * person; students don't browse these partners, so nothing here is published,
 * and the page says so rather than implying an audience that isn't there.
 */
export function PartnerProfilePanel({ access }: { access: CommunityAccess[] }) {
  const w = wording(access)
  const [profile, setProfile] = useState<PartnerProfile | null | undefined>(undefined)
  const [loadError, setLoadError] = useState<string>()

  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [title, setTitle] = useState('')
  const [about, setAbout] = useState('')
  const [city, setCity] = useState('')
  const [website, setWebsite] = useState('')
  const [phone, setPhone] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string>()
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function fill(p: PartnerProfile) {
    setName(p.display_name ?? '')
    setContact(p.contact_name ?? '')
    setTitle(p.title ?? '')
    setAbout(p.about ?? '')
    setCity(p.city ?? '')
    setWebsite(p.website ?? '')
    setPhone(p.phone ?? '')
    setPhoto(p.photo_url)
  }

  useEffect(() => {
    let active = true
    fetchMyPartnerProfile().then(
      (p) => {
        if (!active) return
        setProfile(p)
        if (p) fill(p)
      },
      (e) => {
        if (!active) return
        setLoadError(errorMessage(e))
        setProfile(null)
      },
    )
    return () => {
      active = false
    }
  }, [])

  if (profile === undefined) return <Skeleton className="h-72 w-full" />
  if (profile === null) {
    return (
      <Alert tone={loadError ? 'danger' : 'warning'} title={loadError ? 'Couldn’t load your profile' : 'Your profile isn’t set up yet'}>
        <p>{loadError ?? 'The MySkills team is finishing this part of the portal. Check back soon.'}</p>
      </Alert>
    )
  }

  const items = [
    { key: 'name', label: w.name, done: name.trim().length >= 2 },
    ...(w.organisation ? [{ key: 'contact', label: 'Contact person', done: contact.trim().length >= 2 }] : []),
    { key: 'title', label: w.title, done: title.trim().length >= 2 },
    { key: 'about', label: w.about, done: about.trim().length >= 20 },
    { key: 'phone', label: 'Phone number', done: PHONE.test(phone.trim()) },
  ]
  const doneCount = items.filter((i) => i.done).length
  const complete = doneCount === items.length

  const errors = {
    name: name.trim().length < 2 ? 'Add a name.' : undefined,
    website: website.trim() && !LINK.test(website.trim()) ? 'Should start with https:// and be a full address.' : undefined,
    phone: phone.trim() && !PHONE.test(phone.trim()) ? 'Digits, spaces, + or - only.' : undefined,
  }
  const hasErrors = Object.values(errors).some(Boolean)

  // Against what is saved. Never saved counts as unsaved, so the first save is offered.
  const dirty =
    !profile.saved ||
    name.trim() !== (profile.display_name ?? '') ||
    contact.trim() !== (profile.contact_name ?? '') ||
    title.trim() !== (profile.title ?? '') ||
    about.trim() !== (profile.about ?? '') ||
    city.trim() !== (profile.city ?? '') ||
    website.trim() !== (profile.website ?? '') ||
    phone.trim() !== (profile.phone ?? '') ||
    photo !== profile.photo_url

  async function pickPhoto(file: File | undefined) {
    if (!file) return
    setError(undefined)
    if (!file.type.startsWith('image/')) return setError('Choose an image file.')
    if (file.size > 5 * 1024 * 1024) return setError('Choose an image under 5 MB.')
    setUploading(true)
    try {
      setPhoto(await uploadProfileMedia(file, 'avatar'))
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
      const input = { display_name: name, contact_name: contact, title, about, city, website, phone, photo_url: photo }
      await saveMyPartnerProfile(input)
      // What is now saved, so "unsaved changes" clears without another round trip.
      setProfile({
        ...profile!,
        display_name: name.trim(),
        contact_name: contact.trim() || null,
        title: title.trim() || null,
        about: about.trim() || null,
        city: city.trim() || null,
        website: website.trim() || null,
        phone: phone.trim() || null,
        photo_url: photo,
        saved: true,
      })
      setSaved(true)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const roles = access.filter((a) => !a.sees_all).map((a) => RESOURCE_LABEL[a.resource])
  const shownName = name.trim() || (w.organisation ? 'Your organisation' : 'Your name')

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-5">
        <section className="card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink-900">
              Your profile · {doneCount} of {items.length} done
            </p>
            {complete && <span className="text-xs font-semibold text-emerald-700">Complete</span>}
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100" role="progressbar" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={doneCount} aria-label="Profile completion">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-600 transition-[width] duration-500"
              style={{ width: `${(doneCount / items.length) * 100}%` }}
            />
          </div>
          <ul className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {items.map((i) => (
              <li key={i.key}>
                <button type="button" onClick={() => focusField(i.key)} className="flex items-center gap-2 text-left text-sm hover:underline">
                  {i.done ? <Check size={15} className="shrink-0 text-emerald-600" /> : <Circle size={15} className="shrink-0 text-ink-300" />}
                  <span className={i.done ? 'text-ink-500' : 'font-medium text-ink-900'}>{i.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-ink-900">{w.heading}</h2>
          <p className="mt-0.5 text-sm text-ink-600">
            What the MySkills team knows you by when they introduce a student to you.
          </p>

          <div className="mt-5 flex items-center gap-4">
            <Avatar name={shownName} src={photo ?? undefined} size={72} />
            <div className="min-w-0">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void pickPhoto(e.target.files?.[0])} />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" icon={uploading ? Loader2 : Camera} disabled={uploading} onClick={() => fileRef.current?.click()}>
                  {uploading ? 'Uploading…' : photo ? `Change ${w.photo}` : `Add a ${w.photo}`}
                </Button>
                {photo && !uploading && (
                  <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setPhoto(null)}>
                    Remove
                  </Button>
                )}
              </div>
              <p className="mt-1.5 text-xs text-ink-500">Square works best. It is cropped to a circle.</p>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            <div id="partner-name">
              <Input label={w.name} value={name} onChange={(e) => setName(e.target.value)} error={errors.name} maxLength={120} />
            </div>
            {w.organisation && (
              <div id="partner-contact">
                <Input
                  label="Contact person"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  hint="Who the MySkills team should speak to."
                  maxLength={80}
                />
              </div>
            )}
            <div id="partner-title">
              <Input label={w.title} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={w.titleHint} maxLength={120} />
            </div>
            <div id="partner-about">
              <Textarea
                label={w.about}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                hint={`${w.aboutHint} ${about.trim().length}/1200`}
                rows={5}
                maxLength={1200}
              />
            </div>
            <Input label="City" required={false} value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} placeholder="e.g. Kochi, India" />
            <Input
              label={w.link}
              type="url"
              required={false}
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              error={errors.website}
              placeholder="https://"
            />
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
            <Lock size={16} className="text-ink-500" /> How we reach you
          </h2>
          <p className="mt-0.5 text-sm text-ink-600">Private: only the MySkills team sees these.</p>
          <div className="mt-5 space-y-5">
            <div id="partner-phone">
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
              <p className="mt-0.5 text-xs text-ink-500">The one you sign in with. We email you here when a student is placed with you.</p>
            </div>
          </div>
        </section>

        {error && (
          <Alert tone="danger" title="Couldn’t save that">
            <p>{error}</p>
          </Alert>
        )}

        {/* Only when there is something to save or to say, so it doesn't sit over the page. */}
        {(dirty || saved || hasErrors) && (
          <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-ink-900/[0.08] bg-white/95 p-3 shadow-e2 backdrop-blur">
            <Button disabled={saving || uploading || hasErrors || !dirty} onClick={() => void save()}>
              {saving ? 'Saving…' : 'Save profile'}
            </Button>
            {dirty && profile.saved && (
              <Button variant="ghost" disabled={saving} onClick={() => fill(profile)}>
                Discard changes
              </Button>
            )}
            <span className="text-sm">
              {hasErrors ? (
                <span className="text-red-600">Fix the highlighted fields to save.</span>
              ) : dirty ? (
                <span className="text-amber-700">{profile.saved ? 'You have changes that aren’t saved.' : 'Save to share this with the MySkills team.'}</span>
              ) : (
                <span className="font-medium text-emerald-700">Saved.</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* The profile as the team reads it, built from the form as it is typed. */}
      <aside className="order-first self-start lg:sticky lg:top-6 lg:order-none">
        <h2 className="text-sm font-semibold text-ink-900">How the MySkills team sees you</h2>
        <div className="card mt-3 p-5">
          <div className="flex items-center gap-3">
            <Avatar name={shownName} src={photo ?? undefined} size={56} />
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-semibold leading-snug text-ink-900">{shownName}</p>
              <p className="truncate text-sm font-medium text-brand-700">{title.trim() || roles.join(' · ')}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {roles.map((r) => (
              <span key={r} className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700">
                {r}
              </span>
            ))}
          </div>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-600">
            {about.trim() || <span className="text-ink-400">A few lines about {w.organisation ? 'the organisation' : 'you'} go here.</span>}
          </p>
          <ul className="mt-4 space-y-1.5 border-t border-ink-900/[0.06] pt-3 text-xs text-ink-600">
            {w.organisation && contact.trim() && (
              <li className="flex items-center gap-2">
                <User size={13} className="shrink-0 text-ink-400" /> {contact.trim()}
              </li>
            )}
            {city.trim() && (
              <li className="flex items-center gap-2">
                <MapPin size={13} className="shrink-0 text-ink-400" /> {city.trim()}
              </li>
            )}
            {website.trim() && !errors.website && (
              <li className="flex items-center gap-2">
                <Globe size={13} className="shrink-0 text-ink-400" /> <span className="truncate">{website.trim().replace(/^https?:\/\//, '')}</span>
              </li>
            )}
            {phone.trim() && !errors.phone && (
              <li className="flex items-center gap-2">
                <Phone size={13} className="shrink-0 text-ink-400" /> {phone.trim()}
              </li>
            )}
          </ul>
        </div>
        <p className="mt-2.5 flex items-start gap-2 text-xs leading-relaxed text-ink-500">
          {w.organisation ? <Building2 size={13} className="mt-0.5 shrink-0" /> : <Lock size={13} className="mt-0.5 shrink-0" />}
          This profile is for the MySkills team. It isn’t published anywhere.{' '}
          {w.organisation ? 'What students can see of you is below.' : 'Students don’t browse counsellors or guides; the team introduces you.'}
        </p>
      </aside>
    </div>
  )
}
