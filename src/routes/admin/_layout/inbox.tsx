import { useCallback, useEffect, useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, CheckCircle2, Hand, Inbox as InboxIcon } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { useAuthUser } from '@/lib/useAuth'
import { useStaffAccessContext } from '@/lib/staffAccess'
import { useMyOpenLeads } from '@/lib/institutionLeads'
import { MyWork } from '@/components/admin/MyWork'
import {
  INBOX_KINDS,
  claimInboxItem,
  daysWaiting,
  fetchInbox,
  inboxLink,
  waitedLabel,
  type InboxItem,
  type InboxKind,
} from '@/lib/adminInbox'
import { Alert, EmptyState, PageHeader, Skeleton } from '@/components/ui'

// Every staff member can open the Inbox: it only lists what their own sections
// allow, decided by the database, so a verification-only account sees only
// verification requests.
export const Route = createFileRoute('/admin/_layout/inbox')({
  component: InboxPage,
})

/** Amber after three days, red after a week: how long someone has been left waiting. */
function ageTone(days: number): string {
  if (days >= 7) return 'bg-red-50 text-red-700 ring-red-200'
  if (days >= 3) return 'bg-amber-50 text-amber-800 ring-amber-200'
  return 'bg-ink-100 text-ink-600 ring-ink-200'
}

/**
 * "I'm on it", or who already is. Claiming someone else's takes it over, for
 * when they're away; the button says so.
 */
function ClaimControl({ item, me, onChange }: { item: InboxItem; me: string | undefined; onChange: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  if (item.claim === undefined) return null

  async function set(claim: boolean) {
    setBusy(true)
    setError(undefined)
    try {
      await claimInboxItem(item, claim)
      onChange()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const small = 'rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50'
  const c = item.claim
  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      {!c ? (
        <button type="button" disabled={busy} onClick={() => void set(true)} className={`${small} inline-flex items-center gap-1 border border-brand-200 bg-white text-brand-700 hover:bg-brand-50`}>
          <Hand size={12} /> I’m on it
        </button>
      ) : c.by === me ? (
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white">You’re on it</span>
          <button type="button" disabled={busy} onClick={() => void set(false)} className={`${small} text-ink-500 hover:bg-ink-100 hover:text-ink-800`}>
            Let go
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <span className="max-w-[10rem] truncate rounded-full bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-700" title={`Since ${new Date(c.at).toLocaleString()}`}>
            {c.name} is on it
          </span>
          <button type="button" disabled={busy} onClick={() => void set(true)} className={`${small} text-ink-500 hover:bg-ink-100 hover:text-ink-800`}>
            Take over
          </button>
        </div>
      )}
      {error && <span className="text-[11px] text-red-700">{error}</span>}
    </div>
  )
}

function InboxPage() {
  const { user } = useAuthUser()
  const { isAdmin, sections } = useStaffAccessContext()
  const myLeads = useMyOpenLeads(isAdmin === true || (sections?.includes('demo-requests') ?? false), user?.id)
  const [items, setItems] = useState<InboxItem[] | null | undefined>(undefined)
  const [error, setError] = useState<string>()
  const [kind, setKind] = useState<InboxKind | 'all'>('all')
  const [who, setWho] = useState<'all' | 'mine' | 'nobody'>('all')

  const load = useCallback(async () => {
    try {
      setItems(await fetchInbox())
      setError(undefined)
    } catch (e) {
      setError(errorMessage(e))
    }
  }, [])
  useEffect(() => {
    void load()
  }, [load])
  const claims = (items ?? []).some((i) => i.claim !== undefined)

  const counts = useMemo(() => {
    const c = new Map<InboxKind, number>()
    for (const i of items ?? []) c.set(i.kind, (c.get(i.kind) ?? 0) + 1)
    return c
  }, [items])

  const visible = (items ?? [])
    .filter((i) => kind === 'all' || i.kind === kind)
    .filter((i) => (who === 'all' ? true : who === 'mine' ? i.claim?.by === user?.id : !i.claim))
  const mine = (items ?? []).filter((i) => i.claim?.by === user?.id).length
  const nobody = (items ?? []).filter((i) => !i.claim).length
  const overdue = (items ?? []).filter((i) => daysWaiting(i.created_at) >= 7).length
  const oldest = items && items.length > 0 ? items[0] : null

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Inbox"
        subtitle="Everything waiting on the team, oldest first. Say “I’m on it” so nobody doubles up; each item opens the page where you deal with it."
      />

      {error && (
        <div className="mb-5">
          <Alert tone="danger" title="Couldn’t load the Inbox">
            <p>{error}</p>
          </Alert>
        </div>
      )}

      {items === null && (
        <Alert tone="info" title="The Inbox isn’t set up yet">
          <p>Run docs/supabase-admin-inbox.sql in Supabase, then refresh this page.</p>
        </Alert>
      )}

      {items === undefined && !error && <Skeleton className="h-64 w-full" />}

      {/* Yours first: what you've said "I'm on it" to, and the leads you own. */}
      {items && (claims || myLeads) && (
        <div className="mb-6">
          <h2 className="mb-3 font-display text-lg font-semibold text-ink-900">My work</h2>
          <MyWork claimed={claims ? items.filter((i) => i.claim?.by === user?.id) : null} leads={myLeads} />
        </div>
      )}

      {items && (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="card p-4">
              <p className="font-display text-3xl font-semibold tabular-nums text-ink-900">{items.length}</p>
              <p className="text-sm font-medium text-ink-700">Waiting</p>
            </div>
            <div className="card p-4">
              <p className={`font-display text-3xl font-semibold tabular-nums ${overdue > 0 ? 'text-red-700' : 'text-ink-900'}`}>
                {overdue}
              </p>
              <p className="text-sm font-medium text-ink-700">Waiting a week or more</p>
            </div>
            <div className="card p-4">
              <p className="font-display text-3xl font-semibold text-ink-900">
                {oldest ? waitedLabel(oldest.created_at) : '—'}
              </p>
              <p className="text-sm font-medium text-ink-700">Longest wait</p>
            </div>
          </div>

          {items.length > 0 && claims && (
            <div className="mb-3 inline-flex rounded-xl border border-ink-200 bg-white p-1" role="group" aria-label="Whose">
              {(
                [
                  ['all', 'Everyone’s', items.length],
                  ['mine', 'Mine', mine],
                  ['nobody', 'Nobody’s yet', nobody],
                ] as const
              ).map(([k, label, n]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setWho(k)}
                  aria-pressed={who === k}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    who === k ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100'
                  }`}
                >
                  {label} <span className={`tabular-nums ${who === k ? 'text-white/60' : 'text-ink-400'}`}>{n}</span>
                </button>
              ))}
            </div>
          )}

          {items.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setKind('all')}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  kind === 'all' ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-ink-300 text-ink-600 hover:bg-ink-100'
                }`}
              >
                All <span className="tabular-nums text-ink-400">{items.length}</span>
              </button>
              {[...counts.entries()].map(([k, n]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    kind === k ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-ink-300 text-ink-600 hover:bg-ink-100'
                  }`}
                >
                  {INBOX_KINDS[k].plural} <span className="tabular-nums text-ink-400">{n}</span>
                </button>
              ))}
            </div>
          )}

          {items.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="You’re all caught up"
              description="Nothing is waiting on the team right now. New requests and applications show up here."
            />
          ) : (
            <ul className="card divide-y divide-ink-900/[0.06]">
              {visible.length === 0 && (
                <li className="px-5 py-8 text-center text-sm text-ink-500">
                  {who === 'mine' ? 'You haven’t said “I’m on it” to anything here.' : 'Everything here has someone on it.'}
                </li>
              )}
              {visible.map((i) => {
                const k = INBOX_KINDS[i.kind]
                const days = daysWaiting(i.created_at)
                const link = inboxLink(i)
                return (
                  <li key={`${i.kind}-${i.ref}`} className="flex items-center gap-2 pr-3 sm:pr-4">
                    <Link
                      to={link.to}
                      search={link.search as never}
                      className="group flex min-w-0 flex-1 items-center gap-4 px-4 py-3.5 transition-colors hover:bg-ink-50 sm:px-5"
                    >
                      <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 sm:flex">
                        <InboxIcon size={17} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink-900">{i.title}</span>
                        <span className="block truncate text-xs text-ink-500">
                          {k.label}
                          {i.detail && ` · ${i.detail}`}
                        </span>
                      </span>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${ageTone(days)}`}>
                        {days === 0 ? 'New today' : `Waiting ${waitedLabel(i.created_at)}`}
                      </span>
                      <ArrowRight size={16} className="shrink-0 text-ink-400 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                    <ClaimControl item={i} me={user?.id} onChange={() => void load()} />
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </>
  )
}
