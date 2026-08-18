import { useEffect, useRef, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Check, Copy, Download, Loader2, Printer } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { fetchMyCertificate, type Certificate as Cert } from '@/lib/certificates'
import { saveCertificate } from '@/lib/certificateExport'
import { Certificate } from '@/components/certificate/Certificate'

export const Route = createFileRoute('/certificate')({
  beforeLoad: requireOnboarded,
  component: CertificatePage,
})

function CertificatePage() {
  const [cert, setCert] = useState<Cert | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [copied, setCopied] = useState(false)

  const svgRef = useRef<SVGSVGElement>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string>()

  useEffect(() => {
    fetchMyCertificate()
      .then(setCert)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [])

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
      await saveCertificate(svgRef.current, cert.code)
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
                onClick={() => window.print()}
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
            <p className="mt-2 text-red-600">First run? Apply <code className="rounded bg-red-100 px-1">docs/supabase-certificates.sql</code> in Supabase.</p>
          </div>
        )}

        {!loading && !cert && !error && (
          <div className="no-print card border-dashed p-12 text-center">
            <p className="text-sm font-medium text-ink-800">No certificate yet</p>
            <p className="mt-1 text-sm text-ink-600">Complete your initial assessment to earn your certificate.</p>
            <Link
              to="/practice"
              className="mt-4 inline-flex items-center rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Go to assessment
            </Link>
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
