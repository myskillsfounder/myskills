import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { ADMIN_GROUPS, visibleGroups, type NavItem } from '@/lib/adminNav'
import { daysWaiting, type InboxItem } from '@/lib/adminInbox'
import type { StaffSection } from '@/lib/staffAccess'

/** A line of numbers under an area's title, when the account can see them. */
export type AreaFacts = Partial<Record<string, string | null>>

/** Amber once something has waited three days, red after a week. */
function waitTone(oldestDays: number): string {
  if (oldestDays >= 7) return 'bg-red-50 text-red-700'
  if (oldestDays >= 3) return 'bg-amber-50 text-amber-800'
  return 'bg-brand-50 text-brand-700'
}

function waitingFor(item: NavItem, inbox: InboxItem[]): { n: number; oldest: number } {
  if (!item.inbox) return { n: 0, oldest: 0 }
  const mine = inbox.filter((i) => item.inbox!.includes(i.kind))
  return { n: mine.length, oldest: mine.reduce((d, i) => Math.max(d, daysWaiting(i.created_at)), 0) }
}

/**
 * Every part of the admin panel this person can open, as the menu groups
 * them, on one board: what each page has waiting, and a line of numbers per
 * area. The place to start the day: anything with a count needs someone.
 */
export function AreaBoard({
  isAdmin,
  sections,
  inbox,
  facts,
}: {
  isAdmin: boolean
  sections: StaffSection[]
  inbox: InboxItem[]
  /** Keyed by the group's label. */
  facts: AreaFacts
}) {
  // Home is this page and the Inbox, so it isn't an area.
  const groups = visibleGroups(isAdmin, sections).filter((g) => g.label !== 'Home')
  if (groups.length === 0) return null

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {groups.map((g) => {
        const waits = g.items.map((t) => ({ t, ...waitingFor(t, inbox) }))
        const total = waits.reduce((n, w) => n + w.n, 0)
        const oldest = waits.reduce((d, w) => Math.max(d, w.oldest), 0)
        const line = facts[g.label]
        return (
          <section key={g.label} className="card flex flex-col p-5" aria-label={g.label}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-lg font-semibold text-ink-900">{g.label}</h3>
              {total > 0 ? (
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${waitTone(oldest)}`}>
                  {total} waiting
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  Clear
                </span>
              )}
            </div>
            {line && <p className="mt-1 text-sm leading-snug text-ink-600">{line}</p>}
            <ul className="mt-3 flex-1 space-y-0.5">
              {waits.map(({ t, n, oldest: d }) => (
                <li key={t.to + (t.search?.programme ?? '')}>
                  <Link
                    to={t.to}
                    search={t.search as never}
                    className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-ink-700 transition-colors hover:bg-ink-50 hover:text-ink-900"
                  >
                    <t.icon size={15} />
                    <span className="min-w-0 flex-1 truncate">{t.label}</span>
                    {n > 0 && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${waitTone(d)}`}>{n}</span>
                    )}
                    <ArrowRight size={13} className="shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-500" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

/** Every page in the menu, for anything that needs to look one up by address. */
export const ALL_PAGES: NavItem[] = ADMIN_GROUPS.flatMap((g) => g.items)
