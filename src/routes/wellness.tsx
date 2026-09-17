import { useEffect, useState } from 'react'
import { errorMessage } from '@/lib/errors'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  CheckCircle2,
  Compass,
  HeartHandshake,
  Phone,
  Send,
  ShieldAlert,
} from 'lucide-react'
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
import { Alert, Badge, Button, Input, Skeleton, Textarea } from '@/components/ui'

export const Route = createFileRoute('/wellness')({
  beforeLoad: requireOnboarded,
  component: WellnessPage,
})

const EMPTY_INPUT: WellnessRequestInput = { full_name: '', email: '', phone: '', message: '' }

// India-wide, free or toll-free, and not tied to any one city — the three
// most commonly cited in campus mental-health resource lists. Always shown,
// whether or not a mentor has picked up a request yet, because a crisis
// doesn't wait for staffing.
const HELPLINES = [
  {
    name: 'KIRAN Mental Health Helpline',
    detail: 'Govt of India · 24/7 · multilingual',
    phone: '1800-599-0019',
  },
  {
    name: 'iCall (TISS)',
    detail: 'Mon–Sat, 8am–10pm',
    phone: '9152987821',
  },
  {
    name: 'Vandrevala Foundation',
    detail: '24/7',
    phone: '1860-2662-345',
  },
]

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
    <div className="card p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md">
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

function WellnessPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <Link
          to="/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
            Wellness &amp; Guidance
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            Doing well starts with feeling well. Confidential support for your mind and your
            career, whenever you need it.
          </p>
        </div>

        {/* Crisis resources — always visible, independent of whether a mentor
            has picked anything up yet. A student in crisis shouldn't have to
            wait on a request queue to find a number to call. */}
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2">
            <ShieldAlert size={17} className="shrink-0 text-amber-700" />
            <p className="text-sm font-semibold text-amber-900">In immediate distress?</p>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-amber-800">
            If you or someone you know is in immediate danger, please call{' '}
            <strong>112</strong> (India's emergency number) or go to the nearest hospital. These
            helplines are free, confidential, and staffed by trained counsellors — not a
            substitute for emergency care, but a good place to start.
          </p>
          <ul className="mt-4 space-y-2.5">
            {HELPLINES.map((h) => (
              <li key={h.name} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-amber-900">{h.name}</p>
                  <p className="text-xs text-amber-700">{h.detail}</p>
                </div>
                <a
                  href={`tel:${h.phone.replace(/[^0-9+]/g, '')}`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
                >
                  <Phone size={12} /> {h.phone}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-3 flex items-center gap-2">
          <Badge tone="brand">New</Badge>
          <p className="text-xs font-medium text-ink-500">
            We're onboarding counsellors and mentors — requests are reviewed by the MySkills team.
          </p>
        </div>

        <div className="space-y-5">
          <SupportSection type="psychologist" />
          <SupportSection type="career_mentor" />
        </div>
      </div>
    </AppShell>
  )
}
