import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Award, Check, Copy, ExternalLink, Lock } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { useProfile } from '@/lib/useProfile'
import { fetchMyCertificate, tierForCertificate, type Certificate as Cert } from '@/lib/certificates'
import { AppShell } from '@/components/app/AppShell'
import { Section } from '@/components/profile/ui'
import { DistinctionBadge } from '@/components/certificate/Certificate'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ExperienceSection } from '@/components/profile/ExperienceSection'
import { EducationSection } from '@/components/profile/EducationSection'
import { SkillsSection } from '@/components/profile/SkillsSection'
import { DetailsSection, ProfileCompletion } from '@/components/profile/DetailsSection'

export const Route = createFileRoute('/profile')({
  beforeLoad: requireOnboarded,
  component: ProfilePage,
})

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

  // Renders a placeholder rather than null while loading: it's now the first
  // block on mobile, so returning null left a stray flex gap at the top of the
  // page and made everything below jump once the fetch resolved.
  if (loading) {
    return (
      <Section title="Certificate">
        <div className="h-24 animate-pulse rounded-xl bg-ink-100" />
      </Section>
    )
  }

  const tier = cert ? tierForCertificate(cert) : null

  return (
    <Section title="Certificate">
      {cert && tier ? (
        <div className={`rounded-xl border p-4 ${tier.ui.border} ${tier.ui.bg}`}>
          <div className="flex items-center justify-between gap-2">
            <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${tier.ui.text}`}>
              <Award size={15} />
              {tier.certLabel}
            </span>
            {cert.kind === 'gold' && <DistinctionBadge />}
          </div>
          <p className="mt-2 text-xs text-ink-600">
            {cert.title} · Initial assessment · {cert.percent}%
          </p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <p className="text-[11px] text-ink-500">ID: {cert.code}</p>
            <button
              type="button"
              onClick={copyId}
              aria-label="Copy certificate ID"
              className="text-ink-500 transition-colors hover:text-brand-600"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
          <Link
            to="/certificate"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink-900 shadow-sm transition-colors hover:text-brand-700"
          >
            View certificate <ExternalLink size={12} />
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-ink-300 bg-ink-100 p-4">
          <p className="text-sm font-medium text-ink-800">No certificate yet</p>
          <p className="mt-0.5 text-xs text-ink-600">
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
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-ink-300 bg-ink-100 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-200 text-ink-500">
          <Lock size={18} />
        </span>
        <div>
          <p className="text-sm font-medium text-ink-800">Coming soon</p>
          <p className="text-xs text-ink-500">Track-by-track learning launches soon.</p>
        </div>
      </div>
    </Section>
  )
}

function ProfilePage() {
  const { profile, loading, error, save, upload } = useProfile()

  return (
    <AppShell wide>
      {loading && <p className="text-sm text-ink-600">Loading your profile…</p>}

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

          {/* Personal details moved out of onboarding — asked for here instead. */}
          <ProfileCompletion profile={profile} save={save} />

          {/* Two columns on desktop, one ordered stack on mobile. The column
              wrappers are `contents` below lg, so their children become direct
              flex items and `order-*` can interleave across columns — that's
              what lets the certificate lead on a phone while still sitting in
              the right-hand rail on desktop. */}
          <div className="flex flex-col gap-5 lg:grid lg:grid-cols-3">
            <div className="contents lg:col-span-2 lg:block lg:space-y-5">
              <div className="order-2 lg:order-none">
              </div>
              <div className="order-3 lg:order-none">
                <ExperienceSection profile={profile} save={save} />
              </div>
              <div className="order-4 lg:order-none">
                <EducationSection profile={profile} save={save} />
              </div>
            </div>

            <div className="contents lg:block lg:space-y-5">
              <div className="order-1 lg:order-none">
                <CertificateSection />
              </div>
              <div className="order-5 lg:order-none">
                <DetailsSection profile={profile} save={save} />
              </div>
              <div className="order-6 lg:order-none">
                <ActiveLearningLocked />
              </div>
              <div className="order-7 lg:order-none">
                <SkillsSection profile={profile} save={save} />
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
