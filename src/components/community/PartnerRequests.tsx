import { useCallback, useEffect, useState } from 'react'
import { Briefcase, Building2, ShieldCheck } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import {
  fetchMyCommunityConnections,
  respondCommunityInvite,
  stopCommunitySharing,
  type CommunityConnection,
} from '@/lib/communityPortal'
import { Button } from '@/components/ui'

const day = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

const SAYS: Record<CommunityConnection['resource'], string> = {
  internships: 'says you’re interning with them',
  institutions: 'says you’re studying with them',
}

function Row({ c, onChanged }: { c: CommunityConnection; onChanged: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [confirming, setConfirming] = useState(false)
  const Icon = c.resource === 'internships' ? Briefcase : Building2

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setError(undefined)
    try {
      await fn()
      onChanged()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      // The row outlives its own answer (an accepted request becomes a share).
      setBusy(false)
      setConfirming(false)
    }
  }

  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          {c.status === 'invited' ? (
            <>
              <p className="text-sm leading-snug text-ink-900">
                <span className="font-semibold">{c.organisation}</span> {SAYS[c.resource]}.
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-600">
                If you accept, they can see your name, email and phone number, your Career Readiness Score and your
                certificates, until you stop sharing. They never see your assessment answers. Nothing is shared
                unless you accept.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button size="sm" disabled={busy} onClick={() => void run(() => respondCommunityInvite(c.id, true))}>
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void run(() => respondCommunityInvite(c.id, false))}
                >
                  Decline
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <p className="min-w-0 text-sm leading-snug text-ink-900">
                <span className="font-semibold">{c.organisation}</span> can see your progress
                <span className="block text-xs text-ink-500">Since {day(c.since)}</span>
              </p>
              {confirming ? (
                <span className="inline-flex items-center gap-2 text-sm text-ink-700">
                  Stop sharing?
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => void run(() => stopCommunitySharing(c.id))}>
                    Yes
                  </Button>
                  <button type="button" className="text-sm font-medium text-ink-500" onClick={() => setConfirming(false)}>
                    No
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="text-sm font-semibold text-ink-600 underline underline-offset-2 hover:text-ink-900"
                >
                  Stop sharing
                </button>
              )}
            </div>
          )}
          {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        </div>
      </div>
    </li>
  )
}

/**
 * A company or institution that wants to see this student's record has to ask,
 * and this is where the student answers. It also lists who they are sharing
 * with now, with the way to stop.
 *
 * Nothing is drawn when there is nothing to answer or to show, so it can sit
 * at the top of a page without leaving a gap. `pendingOnly` is for pages where
 * a request should be seen but the standing list would be clutter (the
 * LaunchPad); the Community page shows both.
 */
export function PartnerRequests({ pendingOnly = false, className = '' }: { pendingOnly?: boolean; className?: string }) {
  const [rows, setRows] = useState<CommunityConnection[]>([])

  const load = useCallback(() => {
    void fetchMyCommunityConnections().then(setRows)
  }, [])
  useEffect(load, [load])

  const shown = pendingOnly ? rows.filter((r) => r.status === 'invited') : rows
  if (shown.length === 0) return null
  const asking = shown.some((r) => r.status === 'invited')

  return (
    <section className={`card p-5 ${asking ? 'border-brand-200' : ''} ${className}`} aria-label="Who can see your progress">
      <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-600">
        <ShieldCheck size={14} className="text-brand-600" />
        {asking ? 'A partner is asking to see your progress' : 'Who can see your progress'}
      </h2>
      <ul className="mt-4 divide-y divide-ink-900/[0.06]">
        {shown.map((c) => (
          <Row key={c.id} c={c} onChanged={load} />
        ))}
      </ul>
    </section>
  )
}
