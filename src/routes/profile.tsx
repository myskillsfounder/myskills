import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Award, Check, Copy, ExternalLink } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { useProfile } from '@/lib/useProfile'
import { fetchMyCertificate, tierForCertificate, type Certificate as Cert } from '@/lib/certificates'
import { useMyBadges } from '@/lib/skillBadges'
import { useMyProjects } from '@/lib/mentorProjects'
import { AppShell } from '@/components/app/AppShell'
import { DistinctionBadge } from '@/components/certificate/Certificate'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { AchievementsSection } from '@/components/profile/AchievementsSection'
import { VerificationSection, isVerificationComplete } from '@/components/profile/VerificationSection'
import { useVerification } from '@/lib/useVerification'
import { SkillsSection } from '@/components/profile/SkillsSection'
import { DetailsSection, ProfileCompletion, headerExtras } from '@/components/profile/DetailsSection'

export const Route = createFileRoute('/profile')({
  beforeLoad: requireOnboarded,
  component: ProfilePage,
})

/** Certificate + badge earned from the Foundation assessment — shown inside
 *  the Achievements card, above projects and internships. */
function CertificateCard() {
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
      <div className="h-24 animate-pulse rounded-xl bg-ink-100" />
    )
  }

  const tier = cert ? tierForCertificate(cert) : null

  return (
    <>
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
            Foundational Progress in {cert.title} · {cert.percent}%
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
            Complete the Foundation assessment to earn your certificate of foundational progress.
          </p>
          <Link to="/foundation-assessment" className="mt-2 inline-flex text-xs font-semibold text-brand-600 hover:text-brand-700">
            Go to assessment →
          </Link>
        </div>
      )}
    </>
  )
}

function ProfilePage() {
  const { profile, loading, error, save, upload } = useProfile()
  const verification = useVerification(profile)
  const badges = useMyBadges()
  const projects = useMyProjects()
  const identityVerified = !verification.loading && verification.view.identity === 'verified'

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
          <ProfileHeader
            profile={profile}
            save={save}
            upload={upload}
            verified={identityVerified}
            {...headerExtras(profile)}
          />

          {/* Personal details moved out of onboarding — asked for here instead. */}
          <ProfileCompletion profile={profile} save={save} />

          {/* KYC: a verified profile is one employers can trust. Once it's all
              checked, the tick by the name says so — the checklist only shows
              while there's something to do or a call is booked. */}
          {!verification.loading &&
            (!isVerificationComplete(profile, verification.view) ||
              verification.request?.status === 'requested' ||
              verification.request?.status === 'scheduled') && (
            <VerificationSection
              profile={profile}
              view={verification.view}
              request={verification.request}
              onChange={() => void verification.reload()}
            />
          )}

          {/* Achievements (certificates, mentor-verified projects and, later,
              internships through the app) take the wide column; skill badges
              and details sit beside them. Nothing but the details is typed in
              by the student. On a phone they stack in that order.
              The profile is deliberately fresh: no education history or past
              jobs. */}
          <div className="flex flex-col gap-5 lg:grid lg:grid-cols-3 lg:items-start">
            <div className="lg:col-span-2">
              <AchievementsSection certificate={<CertificateCard />} projects={projects} />
            </div>
            <div className="space-y-5">
              <SkillsSection badges={badges} />
              <DetailsSection profile={profile} save={save} verified={identityVerified} />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
