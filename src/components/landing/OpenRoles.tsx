import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, Briefcase, Building2, CalendarClock, MapPin, Users } from 'lucide-react'
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
    // New internships and the way to apply first; companies looking for
    // interns at the bottom (Paul, 11 Nov 2026).
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pt-12 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#8f6bff]/35 bg-[#1b2470]/40 px-3.5 py-1.5 text-[12.5px] font-semibold text-[#d8c9ff] backdrop-blur">
            <span className="live-ping relative h-1.5 w-1.5 rounded-full bg-emerald-400 text-emerald-400" />
            {roles?.length ? `${roles.length} open ${roles.length === 1 ? 'internship' : 'internships'}` : 'Internships'}
          </p>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            New internships. <span className="bg-gradient-to-r from-[#8f6bff] via-[#b496ff] to-[#dcc7ff] bg-clip-text text-transparent">Apply today.</span>
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-white/70">
            Real work experience with partner companies our team has reviewed. You apply with your Global Readiness Score, and
            the company signs off the work you do.
          </p>
        </div>
        <Link
          {...APPLY}
          onClick={() => trackEvent('internship_login_public')}
          className="press inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-ink-900 transition-colors hover:bg-brand-50"
        >
          Log In to Apply <ArrowRight size={15} />
        </Link>
      </div>

      {roles === undefined ? (
        <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-hidden>
          {[0, 1, 2].map((i) => (
            <li key={i} className={`${glass} h-72 animate-pulse`} />
          ))}
        </ul>
      ) : roles.length ? (
        <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((r) => (
            <RoleCard key={r.id} r={r} />
          ))}
        </ul>
      ) : (
        <div className={`${glass} mt-6 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between`}>
          <div>
            <p className="font-display text-lg font-semibold text-white">New internships are opening soon.</p>
            <p className="mt-1 text-sm text-white/65">Sign up free and build your score now, so you are ready to apply when they open.</p>
          </div>
          <Link
            to="/signup"
            className="press inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-white/30 bg-white/[0.04] px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Sign Up Free <ArrowRight size={15} />
          </Link>
        </div>
      )}

      {/* For companies: the same page is where they look for interns. */}
      <div className="mt-14 overflow-hidden rounded-3xl border border-[#8f6bff]/30 bg-gradient-to-br from-[#2a1f7a]/60 via-[#141a52]/50 to-[#0a1036]/60 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white ring-1 ring-white/20">
              <Building2 size={22} />
            </span>
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c9bfff]">For companies</p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-white">Looking to hire interns?</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-white/70">
                Get top-skilled interns: students who have practised, been scored and earned certificates on MySkills, so you see
                what they can do before they start.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              to="/community-portal/signup"
              onClick={() => trackEvent('internships_partner_cta', { cta: 'signup' })}
              className="press inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-[#7b6cf6] to-[#4f46e5] px-6 text-[15px] font-semibold text-white shadow-[0_10px_30px_-8px_rgba(99,102,241,0.9)] transition-opacity hover:opacity-90"
            >
              Partner With Us <ArrowRight size={17} />
            </Link>
            <Link
              to="/become-an-internship-partner"
              onClick={() => trackEvent('internships_partner_cta', { cta: 'how' })}
              className="press inline-flex h-12 items-center rounded-xl border border-white/25 px-5 text-[15px] font-semibold text-white transition-colors hover:bg-white/10"
            >
              How it works
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
