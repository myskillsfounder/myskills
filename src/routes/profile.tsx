import { useEffect, useState, type ComponentType } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Award, BookOpen, Check, Copy, ExternalLink, Lock, MapPin, Phone, Target } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { useProfile } from '@/lib/useProfile'
import { fetchMyCertificate, type Certificate as Cert } from '@/lib/certificates'
import type { Profile } from '@/lib/profile'
import { careerStageStep, goalsStep } from '@/lib/onboardingContent'
import { AppShell } from '@/components/app/AppShell'
import { Section } from '@/components/profile/ui'
import { DistinctionBadge } from '@/components/certificate/Certificate'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { AboutSection } from '@/components/profile/AboutSection'
import { ExperienceSection } from '@/components/profile/ExperienceSection'
import { EducationSection } from '@/components/profile/EducationSection'
import { SkillsSection } from '@/components/profile/SkillsSection'

export const Route = createFileRoute('/profile')({
  beforeLoad: requireOnboarded,
  component: ProfilePage,
})

type IconType = ComponentType<{ size?: number; className?: string }>

const goalLabel = (id: string) => goalsStep.options.find((o) => o.id === id)?.label ?? id
const careerLabel = (id: string) =>
  careerStageStep.options.find((o) => o.id === id)?.title ?? id

function DetailRow({ icon: Icon, label, value }: { icon: IconType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-ink-500">
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-ink-400">{label}</p>
        <p className="truncate text-sm font-medium text-ink-900">{value || '—'}</p>
      </div>
    </div>
  )
}

function Details({ profile }: { profile: Profile }) {
  const location = [profile.state, profile.country].filter(Boolean).join(', ')
  return (
    <Section title="Details">
      <div className="space-y-4">
        <DetailRow
          icon={Target}
          label="Career stage"
          value={profile.career_stage ? careerLabel(profile.career_stage) : '—'}
        />
        <DetailRow icon={MapPin} label="Location" value={location} />
        <DetailRow icon={Phone} label="Phone" value={profile.phone} />
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <BookOpen size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-ink-400">Focus areas</p>
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
    </Section>
  )
}

/** Certificate + badge earned from the initial assessment. */
function CertificateSection() {
  const [cert, setCert] = useState<Cert | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  async function copyId() {
    if (!cert) return
    try {
      await navigator.clipboard.writeText(cert.code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    fetchMyCertificate()
      .then(setCert)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null

  return (
    <Section title="Certificate">
      {cert ? (
        <div
          className={`rounded-xl border p-4 ${
            cert.kind === 'gold' ? 'border-amber-200 bg-amber-50' : 'border-brand-200 bg-brand-50'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
                cert.kind === 'gold' ? 'text-amber-800' : 'text-brand-700'
              }`}
            >
              <Award size={15} />
              {cert.kind === 'gold' ? 'Gold Certificate' : 'Certificate of Completion'}
            </span>
            {cert.kind === 'gold' && <DistinctionBadge />}
          </div>
          <p className="mt-2 text-xs text-ink-600">
            {cert.title} · Initial assessment · {cert.percent}%
          </p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <p className="text-[11px] text-ink-400">ID: {cert.code}</p>
            <button
              type="button"
              onClick={copyId}
              aria-label="Copy certificate ID"
              className="text-ink-400 transition-colors hover:text-brand-600"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
          <Link
            to="/certificate"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink-800 shadow-sm transition-colors hover:text-brand-700"
          >
            View certificate <ExternalLink size={12} />
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/60 p-4">
          <p className="text-sm font-medium text-ink-700">No certificate yet</p>
          <p className="mt-0.5 text-xs text-ink-500">
            Complete the initial assessment to earn your certificate.
          </p>
          <Link to="/practice" className="mt-2 inline-flex text-xs font-semibold text-brand-600 hover:text-brand-700">
            Go to assessment →
          </Link>
        </div>
      )}
    </Section>
  )
}

/** Locked — track-by-track learning is a future feature. */
function ActiveLearningLocked() {
  return (
    <Section title="Active learning">
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-ink-200 bg-ink-50/60 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-400">
          <Lock size={18} />
        </span>
        <div>
          <p className="text-sm font-medium text-ink-700">Coming soon</p>
          <p className="text-xs text-ink-400">Track-by-track learning launches soon.</p>
        </div>
      </div>
    </Section>
  )
}

function ProfilePage() {
  const { profile, loading, error, save, upload } = useProfile()

  return (
    <AppShell wide>
      {loading && <p className="text-sm text-ink-500">Loading your profile…</p>}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-semibold">Couldn’t load your profile.</p>
          <p className="mt-1">{error}</p>
          <p className="mt-2 text-red-600">
            If this is the first run, apply{' '}
            <code className="rounded bg-red-100 px-1">docs/supabase-schema.sql</code>{' '}
            in your Supabase SQL editor to create the profiles table and storage bucket.
          </p>
        </div>
      )}

      {profile && (
        <div className="space-y-5">
          <ProfileHeader profile={profile} save={save} upload={upload} />

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <AboutSection profile={profile} save={save} />
              <ExperienceSection profile={profile} save={save} />
              <EducationSection profile={profile} save={save} />
            </div>
            <div className="space-y-5">
              <CertificateSection />
              <Details profile={profile} />
              <ActiveLearningLocked />
              <SkillsSection profile={profile} save={save} />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
