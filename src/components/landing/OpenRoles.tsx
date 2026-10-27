import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Briefcase, CalendarClock, MapPin, Users } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'
import { day, fetchPublicRoles, roleFacts, type PublicRole } from '@/lib/internships'

/*
 * The open internships, at the top of the public Internships page (Paul,
 * 27 Oct 2026: "show open internships at the top where students can apply").
 * Real roles only: what the team has made live (docs/supabase-public-
 * internship-roles.sql). Applying needs an account, so Apply logs in (or
 * signs up) and lands on the internships in the Community (lib/afterLogin.ts).
 */

const APPLY = { to: '/login' as const, search: { next: '/community?category=internships' } }

const glass =
  'rounded-2xl border border-[#6d7bff]/20 bg-gradient-to-br from-[#1b2470]/45 via-[#0b1438]/40 to-[#060b24]/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_16px_44px_-18px_rgba(76,86,240,0.7)] backdrop-blur-xl'

function RoleCard({ r }: { r: PublicRole }) {
  return (
    <li className={`${glass} group flex flex-col p-5 transition-colors hover:border-[#a48bff]/45`}>
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6a55e6] to-[#4338ca] text-white ring-1 ring-white/20">
          <Briefcase size={19} />
        </span>
        <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-200">Open</span>
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold leading-snug text-white">{r.title}</h3>
      <p className="mt-0.5 text-sm font-medium text-[#b9a6ff]">{r.organisation}</p>
      <p className="mt-2 flex items-center gap-1.5 text-[13px] text-white/65">
        <MapPin size={13} className="shrink-0" /> {roleFacts(r)}
      </p>
      <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-white/60">{r.summary}</p>
      {r.skills.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {r.skills.slice(0, 4).map((s) => (
            <li key={s} className="rounded-lg border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[11.5px] font-medium text-white/80">
              {s}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="flex flex-col text-[11.5px] text-white/50">
          {r.apply_by && (
            <span className="inline-flex items-center gap-1">
              <CalendarClock size={12} /> Apply by {day(r.apply_by)}
            </span>
          )}
          {r.openings > 1 && (
            <span className="inline-flex items-center gap-1">
              <Users size={12} /> {r.openings} places
            </span>
          )}
        </span>
        <Link
          {...APPLY}
          onClick={() => trackEvent('internship_apply_public', { role: r.id })}
          className="press inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-ink-900 transition-colors hover:bg-brand-50"
        >
          Apply <ArrowRight size={15} />
        </Link>
      </div>
    </li>
  )
}

export function OpenRoles() {
  const [roles, setRoles] = useState<PublicRole[]>()
  useEffect(() => {
    let live = true
    fetchPublicRoles().then((r) => live && setRoles(r))
    return () => {
      live = false
    }
  }, [])

  return (
    // The roles come first (Paul, 27 Oct 2026); the heading follows, smaller.
    <section className="mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 sm:pt-12 lg:px-8">
      <p className="inline-flex items-center gap-2 rounded-full border border-[#8f6bff]/35 bg-[#1b2470]/40 px-3.5 py-1.5 text-[12.5px] font-semibold text-[#d8c9ff] backdrop-blur">
        <span className="live-ping relative h-1.5 w-1.5 rounded-full bg-emerald-400 text-emerald-400" />
        {roles?.length ? `${roles.length} open ${roles.length === 1 ? 'internship' : 'internships'}` : 'Internships'}
      </p>

      {roles === undefined ? (
        <ul className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-hidden>
          {[0, 1, 2].map((i) => (
            <li key={i} className={`${glass} h-72 animate-pulse`} />
          ))}
        </ul>
      ) : roles.length ? (
        <ul className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((r) => (
            <RoleCard key={r.id} r={r} />
          ))}
        </ul>
      ) : (
        <div className={`${glass} mt-5 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between`}>
          <div>
            <p className="font-display text-lg font-semibold text-white">New internships are opening soon.</p>
            <p className="mt-1 text-sm text-white/65">Sign up free and build your score now, so you are ready to apply when they open.</p>
          </div>
          <Link
            to="/signup"
            className="press inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-ink-900 hover:bg-brand-50"
          >
            Get started free <ArrowRight size={15} />
          </Link>
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Open internships. <span className="bg-gradient-to-r from-[#8f6bff] via-[#b496ff] to-[#dcc7ff] bg-clip-text text-transparent">Apply today.</span>
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-white/70">
            Real work experience with partner companies our team has reviewed. You apply with your Global Readiness Score, and
            the company signs off the work you do.
          </p>
        </div>
        <Link {...APPLY} className="text-sm font-semibold text-[#b9a6ff] hover:text-white">
          Have an account? Log in to apply →
        </Link>
      </div>
    </section>
  )
}
