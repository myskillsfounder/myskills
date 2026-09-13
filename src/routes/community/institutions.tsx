import { useEffect, useState } from 'react'
import { errorMessage } from '@/lib/errors'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Award, Building2, ExternalLink, GraduationCap, MapPin, Star } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { fetchInstitutionPartners, type InstitutionPartner } from '@/lib/institutionPartners'
import { AppShell } from '@/components/app/AppShell'
import { Alert, EmptyState, Skeleton } from '@/components/ui'

// The parent /community layout allows signed-out visitors through (its index
// page is a public marketing page), so this leaf needs its own guard to stay
// authenticated-only — it renders inside AppShell, which assumes a session.
// (Applying to become a partner is the separate, public /become-a-partner-institution.)
export const Route = createFileRoute('/community/institutions')({
  beforeLoad: requireOnboarded,
  component: InstitutionsPage,
})

function PartnerCard({ partner }: { partner: InstitutionPartner }) {
  return (
    <div className="card p-6 shadow-sm">
      <div className="flex items-start gap-4">
        {partner.logo_url ? (
          <img
            src={partner.logo_url}
            alt=""
            className="h-16 w-16 shrink-0 rounded-2xl border border-ink-100 object-contain"
          />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <Building2 size={26} />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold text-ink-900">{partner.legal_name}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-600">
            {partner.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={13} className="text-ink-400" /> {partner.city}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Award size={13} className="text-ink-400" />
              {partner.years_in_education} {partner.years_in_education === 1 ? 'year' : 'years'} in
              education
            </span>
            {partner.google_rating != null && (
              <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                <Star size={13} className="fill-amber-500 text-amber-500" /> {partner.google_rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      {partner.courses_offered.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {partner.courses_offered.map((c) => (
            <span
              key={c}
              className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      {(partner.website_url || partner.google_profile_url) && (
        <div className="mt-4 flex flex-wrap gap-4 border-t border-ink-200 pt-4 text-sm">
          {partner.website_url && (
            <a
              href={partner.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-ink-600 hover:text-brand-700"
            >
              <ExternalLink size={14} /> Website
            </a>
          )}
          {partner.google_profile_url && (
            <a
              href={partner.google_profile_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-ink-600 hover:text-brand-700"
            >
              <ExternalLink size={14} /> Google profile
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function InstitutionsPage() {
  const [partners, setPartners] = useState<InstitutionPartner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let active = true
    fetchInstitutionPartners()
      .then((list) => active && setPartners(list))
      .catch((e) => active && setError(errorMessage(e)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <Link
          to="/community"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900"
        >
          <ArrowLeft size={16} /> Back to Community
        </Link>

        <div className="mb-5">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
            Institutions
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            Training institutions verified as MySkills partners — the same skill tracks and
            assessments you practice here, offered offline or in a classroom.
          </p>
        </div>

        {error && (
          <Alert tone="danger" title="Couldn’t load institutions">
            <p>{error}</p>
          </Alert>
        )}

        {loading ? (
          <Skeleton className="h-52 w-full" />
        ) : partners.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No partner institutions yet"
            description="We're onboarding the first ones now. Run a training institute — or know one?"
          />
        ) : (
          <div className="space-y-5">
            {partners.map((p) => (
              <PartnerCard key={p.id} partner={p} />
            ))}
          </div>
        )}

        <Link
          to="/become-a-partner-institution"
          className="lift mt-6 flex items-center justify-between gap-4 rounded-2xl border border-brand-200 bg-brand-50 p-5"
        >
          <div className="min-w-0">
            <p className="font-display text-base font-semibold text-brand-900">Partner with us</p>
            <p className="mt-0.5 text-sm text-brand-800/80">
              Run a training institute? Apply to be listed here for our students.
            </p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
            <GraduationCap size={18} />
          </span>
        </Link>
      </div>
    </AppShell>
  )
}
