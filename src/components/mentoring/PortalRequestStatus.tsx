import { useCallback, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Check, Clock, Lock, Send, ShieldAlert } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import {
  fetchMyPortalRequest,
  requestProblem,
  roleLabel,
  submitPortalRequest,
  type MyPortalRequest,
  type PortalRequestDetails,
} from '@/lib/portalAccess'
import { PortalRequestFields } from '@/components/mentoring/PortalRequestFields'
import { Alert, Button, Skeleton } from '@/components/ui'

const day = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

/** Where a request stands, in the order it happens. */
function Timeline({ rejected }: { rejected: boolean }) {
  const steps: { label: string; note: string; state: 'done' | 'current' | 'stopped' | 'locked' }[] = [
    { label: 'Account created', note: 'Your login is ready.', state: 'done' },
    { label: 'Email confirmed', note: 'Your address is verified.', state: 'done' },
    rejected
      ? { label: 'Team verification', note: 'The team couldn’t approve this request.', state: 'stopped' }
      : { label: 'Team verification', note: 'The MySkills team is checking your request. We email you the outcome.', state: 'current' },
    { label: 'Portal access', note: 'Opens once you are verified.', state: 'locked' },
  ]
  return (
    <ol className="mt-5 space-y-0">
      {steps.map((st, i) => (
        <li key={st.label} className="relative flex gap-3 pb-4 last:pb-0">
          {i < steps.length - 1 && <span className="absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-px bg-ink-200" />}
          <span
            className={`z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
              st.state === 'done'
                ? 'bg-emerald-500 text-white'
                : st.state === 'current'
                  ? 'bg-amber-100 text-amber-700 ring-4 ring-amber-50'
                  : st.state === 'stopped'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-ink-100 text-ink-400'
            }`}
          >
            {st.state === 'done' ? <Check size={14} strokeWidth={3} /> : st.state === 'locked' ? <Lock size={12} /> : <Clock size={13} />}
          </span>
          <span className="min-w-0 pt-0.5">
            <span className={`block text-sm font-semibold ${st.state === 'locked' ? 'text-ink-500' : 'text-ink-900'}`}>{st.label}</span>
            <span className="block text-xs text-ink-500">{st.note}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}

/**
 * What an account with no portal access sees. Signing up opens nothing by
 * itself: until the MySkills team verifies the request, the person is told it
 * is waiting (and when they asked); a request the team turned down says so, with
 * their reason; an account that never asked can ask here.
 *
 * Opening this files the request from what was typed at sign-up (the server
 * does nothing if one already exists), so the person never has to ask twice.
 */
export function PortalRequestStatus({
  name,
  email,
  onCheck,
}: {
  name?: string
  email?: string
  /** Re-check access (the team may have approved while this was open). */
  onCheck: () => Promise<void>
}) {
  const [phase, setPhase] = useState<'loading' | 'status' | 'form'>('loading')
  const [req, setReq] = useState<MyPortalRequest | null>(null)
  const [error, setError] = useState<string>()
  const [details, setDetails] = useState<PortalRequestDetails>({ role: '', organisation: '', phone: '', message: '' })
  const [busy, setBusy] = useState(false)

  const open = useCallback(async () => {
    setError(undefined)
    try {
      await submitPortalRequest()
      setReq(await fetchMyPortalRequest())
      setPhase('status')
    } catch (e) {
      const message = errorMessage(e)
      // Signed up without saying what they do (an older account): ask here.
      if (/say what you do/i.test(message)) setPhase('form')
      else {
        setError(message)
        setPhase('status')
      }
    }
  }, [])

  useEffect(() => {
    void open()
  }, [open])

  async function send() {
    setBusy(true)
    setError(undefined)
    try {
      await submitPortalRequest(details)
      setReq(await fetchMyPortalRequest())
      setPhase('status')
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  async function check() {
    setBusy(true)
    try {
      await onCheck()
      setReq(await fetchMyPortalRequest())
    } finally {
      setBusy(false)
    }
  }

  if (phase === 'loading') return <Skeleton className="h-56 w-full" />

  if (phase === 'form') {
    const problem = requestProblem(details)
    return (
      <div className="card mx-auto max-w-lg p-6 sm:p-8">
        <h1 className="font-display text-xl font-semibold text-ink-900">Request access</h1>
        <p className="mt-1 text-sm text-ink-600">
          This account doesn’t have access to the Community portal yet. Tell us what you do and the MySkills team will
          verify you.
        </p>
        <div className="mt-5">
          <PortalRequestFields value={details} onChange={setDetails} />
        </div>
        {error && (
          <div className="mt-4">
            <Alert tone="danger" title="Couldn’t send your request">
              <p>{error}</p>
            </Alert>
          </div>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button icon={Send} disabled={busy || problem !== null} onClick={() => void send()}>
            {busy ? 'Sending…' : 'Send request'}
          </Button>
          {problem && <span className="text-xs text-ink-500">{problem}</span>}
        </div>
      </div>
    )
  }

  if (!req) {
    return (
      <div className="card mx-auto max-w-lg p-6 sm:p-8">
        <h1 className="font-display text-xl font-semibold text-ink-900">No access yet</h1>
        <p className="mt-2 text-sm text-ink-600">
          This account doesn’t have access to the Community portal. If you work with MySkills students, ask the team to
          verify you.
        </p>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        <div className="mt-4 flex gap-4 text-sm font-semibold">
          <Link to="/community" className="text-brand-700 hover:underline">
            Partner with MySkills
          </Link>
        </div>
      </div>
    )
  }

  const rejected = req.status === 'rejected'
  return (
    <div className="card mx-auto max-w-lg p-6 sm:p-8">
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
          rejected ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
        }`}
      >
        {rejected ? <ShieldAlert size={22} /> : <Clock size={22} />}
      </span>
      <h1 className="mt-4 font-display text-2xl font-semibold text-ink-900">
        {rejected ? 'We couldn’t verify your request' : 'Waiting for verification'}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-600">
        {rejected ? (
          'The MySkills team wasn’t able to approve your request to join the Community portal.'
        ) : (
          <>
            Thanks{name ? `, ${name.split(' ')[0]}` : ''}. Your email is confirmed and the MySkills team is verifying
            your request. You’ll have access once they approve it
            {email ? <>, and we’ll email you at <strong className="text-ink-800">{email}</strong></> : null}.
          </>
        )}
      </p>

      <Timeline rejected={rejected} />

      <dl className="mt-5 space-y-2 rounded-xl bg-ink-50 p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-500">Asked to be</dt>
          <dd className="text-right font-medium text-ink-900">
            {roleLabel(req.role)}
            {req.organisation ? ` · ${req.organisation}` : ''}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-500">Requested</dt>
          <dd className="font-medium text-ink-900">{day(req.created_at)}</dd>
        </div>
      </dl>

      {rejected && req.note && (
        <p className="mt-4 whitespace-pre-line rounded-xl bg-red-50 p-4 text-sm leading-relaxed text-red-900">{req.note}</p>
      )}
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

      {!rejected && (
        <div className="mt-5">
          <Button variant="secondary" disabled={busy} onClick={() => void check()}>
            {busy ? 'Checking…' : 'Check again'}
          </Button>
        </div>
      )}
    </div>
  )
}
