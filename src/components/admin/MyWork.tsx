import { Link } from '@tanstack/react-router'
import { Hand, Target } from 'lucide-react'
import { INBOX_KINDS, daysWaiting, inboxLink, waitedLabel, type InboxItem } from '@/lib/adminInbox'
import { stageInfo, type InstitutionLead } from '@/lib/institutionLeads'

/** Amber after three days, red after a week: how long someone has been left waiting. */
function ageTone(days: number): string {
  if (days >= 7) return 'bg-red-50 text-red-700'
  if (days >= 3) return 'bg-amber-50 text-amber-800'
  return 'bg-ink-100 text-ink-600'
}

const todayIso = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const shortDay = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

/**
 * What this person has said "I'm on it" to, and the institution leads they own,
 * follow-ups due first: the list to work through before anything new. Top of the Inbox.
 */
export function MyWork({ claimed, leads }: { claimed: InboxItem[] | null; leads: InstitutionLead[] | null }) {
  const today = todayIso()
  const due = (leads ?? []).filter((l) => l.follow_up_on && l.follow_up_on <= today).length
  // Each half only when it can be used: claims need docs/supabase-inbox-claims.sql,
  // leads need the Institution leads section.
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {claimed && (
        <div className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="inline-flex items-center gap-2 font-display text-base font-semibold text-ink-900">
              <Hand size={16} className="text-brand-600" /> You’re on it
            </h3>
            <span className="text-xs font-semibold tabular-nums text-ink-500">{claimed.length}</span>
          </div>
          {claimed.length === 0 ? (
            <p className="mt-2 text-sm text-ink-600">Nothing yet. Say “I’m on it” on anything below so the team knows.</p>
          ) : (
            <ul className="mt-2 divide-y divide-ink-100">
              {claimed.map((i) => (
                <li key={`${i.kind}-${i.ref}`}>
                  <Link to={inboxLink(i).to} search={inboxLink(i).search as never} className="group flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900 group-hover:text-brand-700">{i.title}</p>
                      <p className="truncate text-xs text-ink-500">
                        {INBOX_KINDS[i.kind].label}
                        {i.detail ? ` · ${i.detail}` : ''}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${ageTone(daysWaiting(i.created_at))}`}>
                      {waitedLabel(i.created_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {leads && (
        <div className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="inline-flex items-center gap-2 font-display text-base font-semibold text-ink-900">
              <Target size={16} className="text-brand-600" /> Your institution leads
            </h3>
            {due > 0 ? (
              <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">{due} to call today</span>
            ) : (
              <span className="text-xs font-semibold tabular-nums text-ink-500">{leads.length}</span>
            )}
          </div>
          {leads.length === 0 ? (
            <p className="mt-2 text-sm text-ink-600">
              None open.{' '}
              <Link to="/admin/institution-leads" className="font-semibold text-brand-700 hover:underline">
                See every lead
              </Link>
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-ink-100">
              {leads.slice(0, 6).map((l) => {
                const late = l.follow_up_on != null && l.follow_up_on <= today
                return (
                  <li key={l.id}>
                    <Link to="/admin/institution-leads" search={{ lead: l.id }} className="group flex items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-900 group-hover:text-brand-700">{l.full_name}</p>
                        <p className="truncate text-xs text-ink-500">
                          {stageInfo(l.stage).label} · {l.institution_name}
                          {l.course ? ` · ${l.course}` : ''}
                        </p>
                      </div>
                      {l.follow_up_on && (
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${late ? 'bg-red-50 text-red-700' : 'bg-ink-100 text-ink-600'}`}>
                          {l.follow_up_on < today ? `Overdue · ${shortDay(l.follow_up_on)}` : l.follow_up_on === today ? 'Call today' : shortDay(l.follow_up_on)}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
              {leads.length > 6 && (
                <li className="pt-2.5 text-xs">
                  <Link to="/admin/institution-leads" className="font-semibold text-brand-700 hover:underline">
                    {leads.length - 6} more
                  </Link>
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
