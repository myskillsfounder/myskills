import { useEffect, useState } from 'react'
import { errorMessage } from '@/lib/errors'
import { createFileRoute } from '@tanstack/react-router'
import { Award, Search } from 'lucide-react'
import { fetchAllCertificates, type AdminCertificate } from '@/lib/admin'
import type { CertificateKind } from '@/lib/certificates'
import { Alert, Badge, EmptyState, Input, PageHeader, Skeleton } from '@/components/ui'

export const Route = createFileRoute('/admin/certificates')({
  component: CertificatesPage,
})

const KIND_TONE: Record<CertificateKind, 'gold' | 'neutral' | 'warning'> = {
  gold: 'gold',
  silver: 'neutral',
  bronze: 'warning',
}

const fmtDate = (v: string) => new Date(v).toLocaleDateString()

function CertificatesPage() {
  const [certificates, setCertificates] = useState<AdminCertificate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(undefined)
      try {
        setCertificates(await fetchAllCertificates())
      } catch (e) {
        setError(errorMessage(e))
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const term = search.trim().toLowerCase()
  const filtered = term
    ? certificates.filter(
        (c) => c.recipient_name.toLowerCase().includes(term) || c.code.toLowerCase().includes(term),
      )
    : certificates

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Certificates"
        subtitle="Issued automatically when someone completes the initial assessment — read-only, since grading and issuing both happen server-side."
      />

      <div className="mb-5 max-w-sm">
        <Input
          label=""
          required={false}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or certificate code"
          aria-label="Search certificates"
        />
      </div>

      {error && (
        <div className="mb-5">
          <Alert tone="danger" title="Couldn’t load certificates">
            <p>{error}</p>
          </Alert>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Award}
          title={term ? 'No matches' : 'No certificates yet'}
          description={term ? 'Try a different name or code.' : 'Issued once someone finishes the assessment.'}
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-ink-200 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Recipient</th>
                <th scope="col" className="px-5 py-3 font-semibold">Code</th>
                <th scope="col" className="px-5 py-3 font-semibold">Tier</th>
                <th scope="col" className="px-5 py-3 font-semibold">Score</th>
                <th scope="col" className="px-5 py-3 font-semibold">Title</th>
                <th scope="col" className="px-5 py-3 font-semibold">Issued</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-ink-100 last:border-0">
                  <td className="px-5 py-3 font-medium text-ink-900">{c.recipient_name}</td>
                  <td className="px-5 py-3 font-mono text-xs text-ink-600">{c.code}</td>
                  <td className="px-5 py-3">
                    <Badge tone={KIND_TONE[c.kind]}>{c.kind}</Badge>
                  </td>
                  <td className="px-5 py-3 text-ink-600">{c.percent}%</td>
                  <td className="px-5 py-3 text-ink-600">{c.title}</td>
                  <td className="px-5 py-3 text-ink-600">{fmtDate(c.issued_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-500">
          <Search size={12} />
          Showing {filtered.length} of {certificates.length}
        </p>
      )}
    </>
  )
}
