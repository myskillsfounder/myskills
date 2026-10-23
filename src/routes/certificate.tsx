import { useEffect, useRef, useState } from 'react'
import { errorMessage } from '@/lib/errors'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Check, Copy, Download, Loader2, Printer } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { fetchMyCertificates, tierForCertificate, type Certificate as Cert } from '@/lib/certificates'
import { saveCertificate } from '@/lib/certificateExport'
import { trackCertificateDownload } from '@/lib/analytics'
import { Certificate } from '@/components/certificate/Certificate'

/** ?programme=<slug> or ?code=<certificate ID> picks one of the student's
 *  certificates; without either, the first they earned. */
export const Route = createFileRoute('/certificate')({
  beforeLoad: requireOnboarded,
  validateSearch: (s: Record<string, unknown>): { programme?: string; code?: string } => ({
    ...(typeof s.programme === 'string' && s.programme ? { programme: s.programme } : {}),
    ...(typeof s.code === 'string' && s.code ? { code: s.code } : {}),
  }),
  component: CertificatePage,
})

function CertificatePage() {
  const { programme, code } = Route.useSearch()
  const navigate = useNavigate()
  const [certs, setCerts] = useState<Cert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [copied, setCopied] = useState(false)

  const svgRef = useRef<SVGSVGElement>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string>()

  useEffect(() => {
    fetchMyCertificates()
      .then(setCerts)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  const cert =
    certs.find((c) => (code ? c.code.toUpperCase() === code.trim().toUpperCase() : programme ? c.programme === programme : false)) ??
    (code || programme ? null : (certs[0] ?? null))

  async function copyId() {
    if (!cert) return
    try {
      await navigator.clipboard.writeText(cert.code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  /** Exports the certificate SVG alone — not a screenshot of the page. */
  async function download() {
    if (!cert || !svgRef.current || saving) return
    setSaving(true)
    setSaveError(undefined)
    try {
      const outcome = await saveCertificate(svgRef.current, cert.code)
      if (outcome !== 'cancelled') trackCertificateDownload(outcome)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save the certificate.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen surface-paper py-6">
      <div className="mx-auto max-w-4xl px-4">
        <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900"
          >
            <ArrowLeft size={16} /> Back to profile
          </Link>

          {cert && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={download}
                disabled={saving}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-70"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                {saving ? 'Preparing…' : 'Download'}
              </button>

              {/* Print is a desktop convenience for "save as PDF"; mobile
                  browsers handle it poorly, so it's hidden there. */}
              <button
                type="button"
                onClick={() => {
                  trackCertificateDownload('print')
                  window.print()
                }}
                className="hidden h-10 items-center gap-1.5 rounded-full border border-ink-300 bg-white px-4 text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-100 sm:inline-flex"
              >
                <Printer size={15} /> Print
              </button>
            </div>
          )}
        </div>

        {saveError && (
          <div className="no-print mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {saveError}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 py-16 text-sm text-ink-600">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            Couldn’t load your certificate. {error}
          </div>
        )}

        {certs.length > 1 && (
          <div className="no-print mb-5 flex flex-wrap gap-2" role="group" aria-label="Your certificates">
            {certs.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={c.id === cert?.id}
                onClick={() => void navigate({ to: '/certificate', search: { programme: c.programme }, replace: true })}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  c.id === cert?.id ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-300 bg-white text-ink-800 hover:bg-ink-100'
                }`}
              >
                {c.title} · {tierForCertificate(c).label}
              </button>
            ))}
          </div>
        )}

        {!loading && !cert && !error && (
          <div className="no-print card border-dashed p-12 text-center">
            <p className="text-sm font-medium text-ink-800">{certs.length ? 'No certificate here' : 'No certificate yet'}</p>
            <p className="mt-1 text-sm text-ink-600">
              {certs.length
                ? 'You don’t have a certificate with that programme or ID. Pick one of yours above.'
                : 'Every programme has a Foundation assessment. Finish its foundation modules, take it once, and you earn a Foundation certificate for that programme.'}
            </p>
            {!certs.length && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Link
                  to="/foundation-assessment"
                  className="inline-flex items-center rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Digital Marketing Foundation assessment
                </Link>
                <Link
                  to="/programmes"
                  className="inline-flex items-center rounded-full border border-ink-300 bg-white px-4 py-2 text-sm font-semibold text-ink-800 hover:bg-ink-100"
                >
                  Other programmes
                </Link>
              </div>
            )}
          </div>
        )}

        {cert && <Certificate cert={cert} svgRef={svgRef} />}

        {cert && (
          <div className="no-print mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-ink-300 bg-white px-3 py-1.5 text-xs font-medium text-ink-600">
              Certificate ID: <span className="font-semibold text-ink-900">{cert.code}</span>
            </span>
            <button
              type="button"
              onClick={copyId}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink-300 bg-white px-3 py-1.5 text-xs font-semibold text-ink-800 transition-colors hover:bg-ink-100"
            >
              {copied ? (
                <>
                  <Check size={13} /> Copied
                </>
              ) : (
                <>
                  <Copy size={13} /> Copy ID
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
