import { useEffect, useState } from 'react'
import { errorMessage } from '@/lib/errors'
import { createFileRoute } from '@tanstack/react-router'
import { CheckCircle2, Compass, Heart, HeartHandshake, Leaf, Lock, Phone, Send, Sparkles } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { useAuthUser } from '@/lib/useAuth'
import { useProfile } from '@/lib/useProfile'
import {
  fetchMyOpenWellnessRequest,
  submitWellnessRequest,
  type WellnessRequest,
  type WellnessRequestInput,
  type WellnessRequestType,
} from '@/lib/wellness'
import { AppShell } from '@/components/app/AppShell'
import { CommunityHero, HowItWorks } from '@/components/community/CommunityHero'
import { Alert, Button, Input, Skeleton, Textarea } from '@/components/ui'

export const Route = createFileRoute('/wellness')({
  beforeLoad: requireOnboarded,
  component: WellnessPage,
})

const EMPTY_INPUT: WellnessRequestInput = { full_name: '', email: '', phone: '', message: '' }

const COPY: Record<
  WellnessRequestType,
  { title: string; blurb: string; placeholder: string; confirmNote: string }
> = {
  psychologist: {
    title: 'Talk to a counsellor',
    blurb:
      'Studying and job-hunting can weigh on you as much as any exam. Reach out if something’s been sitting heavy — this is a private, judgment-free request, not a diagnosis.',
    placeholder: 'Share as much or as little as you’d like — what’s been on your mind?',
    confirmNote: 'we’ll reach out privately, at your pace',
  },
  career_mentor: {
    title: 'Talk to a career mentor',
    blurb:
      'Unsure which skill track to focus on, how to read a job description, or what’s next after your certificate? A mentor can talk it through with you.',
    placeholder: 'What would you like guidance on?',
    confirmNote: 'a mentor will follow up soon',
  },
}

function RequestForm({
  type,
  onSubmitted,
}: {
  type: WellnessRequestType
  onSubmitted: (req: WellnessRequest) => void
}) {
  const { user } = useAuthUser()
  const { profile } = useProfile()
  const copy = COPY[type]

  const [form, setForm] = useState<WellnessRequestInput>(EMPTY_INPUT)
  const [errors, setErrors] = useState<Partial<Record<keyof WellnessRequestInput, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>()

  useEffect(() => {
    setForm((f) => ({
      ...f,
      full_name: f.full_name || profile?.full_name || '',
      email: f.email || user?.email || '',
    }))
  }, [profile?.full_name, user?.email])

  const set = (key: keyof WellnessRequestInput) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
  }

  function validate(): Partial<Record<keyof WellnessRequestInput, string>> {
    const found: Partial<Record<keyof WellnessRequestInput, string>> = {}
    if (form.full_name.trim().length < 2) found.full_name = 'Please enter your name.'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
      found.email = 'Enter a valid email address.'
    }
    return found
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(undefined)

    const found = validate()
    if (Object.keys(found).length > 0) {
      setErrors(found)
      return
    }

    setSubmitting(true)
    try {
      await submitWellnessRequest(type, form)
      onSubmitted({
        id: 'local',
        created_at: new Date().toISOString(),
        type,
        status: 'pending',
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        message: form.message.trim() || null,
      })
    } catch (err) {
      setSubmitError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4 border-t border-ink-200 pt-4">
      <Input label="Your name" value={form.full_name} onChange={set('full_name')} error={errors.full_name} autoComplete="name" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Email" value={form.email} onChange={set('email')} error={errors.email} type="email" autoComplete="email" />
        <Input label="Phone" value={form.phone} onChange={set('phone')} error={errors.phone} required={false} type="tel" autoComplete="tel" />
      </div>
      <Textarea
        label="Anything you'd like to share?"
        value={form.message}
        onChange={set('message')}
        error={errors.message}
        required={false}
        rows={3}
        placeholder={copy.placeholder}
      />

      <p className="text-xs text-ink-500">
        Only the MySkills team can see this request — it isn't visible to other students.
      </p>

      {submitError && (
        <Alert tone="danger" title="Couldn't send your request">
          <p>{submitError}</p>
        </Alert>
      )}

      <Button type="submit" size="sm" icon={Send} disabled={submitting}>
        {submitting ? 'Sending…' : 'Send request'}
      </Button>
    </form>
  )
}

function SupportSection({ type }: { type: WellnessRequestType }) {
  const copy = COPY[type]
  const Icon = type === 'psychologist' ? HeartHandshake : Compass

  const [loading, setLoading] = useState(true)
  const [existing, setExisting] = useState<WellnessRequest | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    let active = true
    fetchMyOpenWellnessRequest(type)
      .then((r) => active && setExisting(r))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [type])

  return (
    <div id={type === 'career_mentor' ? 'career-guidance' : 'counselling'} className="card scroll-mt-24 p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md ${type === 'psychologist' ? 'from-rose-400 to-pink-500' : 'from-brand-500 to-brand-700'}`}>
          <Icon size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold text-ink-900">{copy.title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-600">{copy.blurb}</p>
        </div>
      </div>

      {loading ? (
        <Skeleton className="mt-4 h-10 w-full" />
      ) : existing ? (
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-emerald-50 p-4">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-emerald-900">
              Request sent — {copy.confirmNote}.
            </p>
            <p className="mt-0.5 text-xs text-emerald-700">
              Sent {new Date(existing.created_at).toLocaleDateString()}
              {existing.status === 'contacted' ? ' · someone from the team has been in touch' : ''}
            </p>
          </div>
        </div>
      ) : showForm ? (
        <RequestForm type={type} onSubmitted={setExisting} />
      ) : (
        <Button variant="secondary" size="sm" className="mt-4" onClick={() => setShowForm(true)}>
          Request support
        </Button>
      )}
    </div>
  )
}

/** What a student can count on here, said before anything is asked of them. */
const PROMISES: { icon: typeof Heart; title: string; body: string }[] = [
  { icon: Lock, title: 'Private', body: 'Only the MySkills team sees what you write. Never your mentors, companies or classmates.' },
  { icon: HeartHandshake, title: 'A real person', body: 'Every request is read by someone who cares, never a bot.' },
  { icon: Leaf, title: 'At your pace', body: 'Share as much or as little as you like. There is no wrong way to ask.' },
]

/**
 * Wellness, wellbeing first (Paul, 27 Oct 2026: "wellness should prioritise
 * the wellbeing of a student"): a calm page that says it is safe to ask,
 * points to help right away if they are in danger, and then offers a
 * counsellor before career guidance.
 */
function WellnessPage() {
  return (
    <AppShell wide>
      <div className="space-y-6">
        <CommunityHero
          tone="wellness"
          icon={Heart}
          eyebrow="Wellness"
          title="How are you, really?"
          accent="Your wellbeing comes first."
          body="Exams, deadlines, worrying about what comes next: student life carries a lot of pressure that doesn’t always show. You don’t have to carry it alone. Talk to someone, privately and without judgment."
          points={[
            { icon: Lock, label: 'Private' },
            { icon: HeartHandshake, label: 'Real people' },
            { icon: Leaf, label: 'At your pace' },
          ]}
        />

        {/* Before anything else: help right now, for anyone who needs it. */}
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-white p-4 sm:p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <Phone size={18} />
          </span>
          <p className="text-sm leading-relaxed text-ink-700">
            <span className="font-semibold text-ink-900">If you feel unsafe or are thinking of harming yourself, please talk to someone now.</span>{' '}
            Call <a href="tel:14416" className="font-semibold text-rose-600 underline-offset-2 hover:underline">Tele-MANAS on 14416</a>, India’s free
            mental health helpline, open 24 hours, or call <a href="tel:112" className="font-semibold text-rose-600 underline-offset-2 hover:underline">112</a> in an emergency.
          </p>
        </div>

        <ul className="grid gap-4 sm:grid-cols-3">
          {PROMISES.map((p) => (
            <li key={p.title} className="rounded-2xl bg-gradient-to-br from-rose-50/80 to-amber-50/60 p-5 ring-1 ring-rose-100">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-rose-500 shadow-e1">
                <p.icon size={18} />
              </span>
              <p className="mt-3 font-semibold text-ink-900">{p.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-600">{p.body}</p>
            </li>
          ))}
        </ul>

        <div className="mx-auto max-w-2xl space-y-5">
          <div className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
            <Sparkles size={17} className="mt-0.5 shrink-0 text-rose-500" />
            <p className="text-sm leading-relaxed text-ink-700">
              <span className="font-semibold text-ink-900">We're onboarding counsellors and mentors</span> so these conversations
              are handled by people who care. Until then, every request is read personally by the MySkills team, and we'll get
              back to you.
            </p>
          </div>
          <SupportSection type="psychologist" />
          <SupportSection type="career_mentor" />
        </div>

        <HowItWorks
          tone="wellness"
          steps={[
            { title: 'Send a private request', body: 'Only the MySkills team can see it.' },
            { title: 'A real person reads it', body: 'Never a bot, and never shared with anyone else.' },
            { title: 'We reach out', body: 'By email or phone, at your pace.' },
          ]}
        />
      </div>
    </AppShell>
  )
}
