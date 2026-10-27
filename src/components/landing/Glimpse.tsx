import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, BadgeCheck, Check, Flame, Lock, type LucideIcon } from 'lucide-react'
import { Flag, Nurse } from '@/components/studyAbroad/Cards'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { trackEvent } from '@/lib/analytics'
import { fetchMentors, type Mentor } from '@/lib/mentors'
import { OpenRoles } from '@/components/landing/OpenRoles'

/*
 * A glimpse of a part of the platform that lives behind sign-in (Paul,
 * 27 Oct 2026: "these pages don't give a glimpse"): Mentors, Study Abroad
 * and Internships. A visitor sees what it is, what they get, how it works
 * and a locked look inside, then signs up or logs in and lands on the real
 * page (lib/afterLogin.ts). Signed-in students never see this; their route
 * sends them straight in. Built in the home page's navy and liquid glass.
 */

const glass =
  'rounded-2xl border border-[#6d7bff]/20 bg-gradient-to-br from-[#1b2470]/45 via-[#0b1438]/40 to-[#060b24]/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_16px_44px_-18px_rgba(76,86,240,0.7)] backdrop-blur-xl'
const gradientText = 'bg-gradient-to-r from-[#8f6bff] via-[#b496ff] to-[#dcc7ff] bg-clip-text text-transparent'
const eyebrow = 'text-[11px] font-semibold uppercase tracking-[0.32em] text-[#b9a6ff]'
/** The hero cards' colours: a tinted glass and a matching icon. */
const TONES = {
  violet: { card: 'from-[#6d4fff]/35 via-[#2a1f7a]/25 to-white/[0.04] border-white/25', icon: 'from-[#8f6bff] to-[#5b3fd6]' },
  blue: { card: 'from-[#3b63ff]/35 via-[#16257a]/25 to-white/[0.04] border-white/25', icon: 'from-[#5b8bff] to-[#2f4fd6]' },
  pink: { card: 'from-[#e04ab8]/35 via-[#5a1a6a]/25 to-white/[0.04] border-white/25', icon: 'from-[#ec4899] to-[#a12d9a]' },
  amber: { card: 'from-[#f59e0b]/30 via-[#6a3410]/25 to-white/[0.04] border-white/25', icon: 'from-[#f59e0b] to-[#c2410c]' },
}

const tile =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6a55e6] to-[#4338ca] text-white shadow-[0_0_20px_rgba(99,102,241,0.6)] ring-1 ring-white/20'

export interface GlimpseItem {
  title: string
  sub: string
  /** A photo in public/home, or none for an icon card. */
  photo?: string
  /** Shown clearly; the rest of the look inside is blurred until sign-in. */
  open?: boolean
}

/** A card in the hero; with `match`, it shows the published mentors whose
 *  expertise or headline fits it (lib/mentors.ts, public by design). */
export interface HeroCard {
  icon: LucideIcon
  title: string
  body: string
  tone: keyof typeof TONES
  match?: RegExp
}

/** One thing to put in front of a visitor first: "Trending now". */
export interface GlimpseTrending {
  title: string
  /** Who it is with: the university, the company. */
  where: string
  /** A partner ribbon, e.g. "MySkills · Top partner". */
  partner: string
  body: string
  points: string[]
  /** A two-letter country for the flag. */
  country?: string
  /** Nursing gets the drawn nurse (components/studyAbroad/Cards.tsx). */
  art?: 'nurse'
  /** Where a visitor lands after logging in to see it. */
  next: string
}

export interface GlimpseProps {
  id: 'mentors' | 'study-abroad' | 'internships'
  icon: LucideIcon
  kicker: string
  title: string
  accent: string
  body: string
  /** Short chips under the hero's line, e.g. the mentors' industries. */
  tags?: string[]
  /** Cards in place of the hero's photo, e.g. the mentors' industries. */
  heroCards?: HeroCard[]
  photo: string
  photoAlt: string
  features: { icon: LucideIcon; title: string; body: string }[]
  steps: { title: string; body: string }[]
  peek: { title: string; note: string; items: GlimpseItem[] }
  trending?: GlimpseTrending
  /** Open on the trending card, with no hero (Study Abroad, Paul 27 Oct 2026). */
  trendingFirst?: boolean
  /** Open on the live internships, with no hero (Internships, Paul 27 Oct 2026). */
  rolesFirst?: boolean
  /** Where a visitor lands after logging in. */
  next: string
}

/** The published mentors, once, for hero cards that show them. */
function useListedMentors(wanted: boolean): Mentor[] | undefined {
  const [list, setList] = useState<Mentor[]>()
  useEffect(() => {
    if (!wanted) return
    let live = true
    fetchMentors().then(
      (l) => live && setList(l),
      () => live && setList([]),
    )
    return () => {
      live = false
    }
  }, [wanted])
  return list
}

/** Who fits a card: matched on what they list as expertise, then their headline. */
function mentorsFor(card: HeroCard, list: Mentor[] | undefined): Mentor[] | undefined {
  if (!card.match || !list) return undefined
  const re = card.match
  return list.filter((m) => re.test([...(m.expertise ?? []), m.headline].join(' '))).slice(0, 2)
}

function MentorChip({ m }: { m: Mentor }) {
  const initials = m.full_name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
  return (
    <li className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/[0.08] p-2 backdrop-blur-md">
      {m.avatar_url ? (
        <img src={m.avatar_url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white/30" />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white ring-2 ring-white/30">
          {initials}
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-semibold text-white">{m.full_name}</span>
        <span className="block truncate text-[11px] text-white/65">{m.headline}</span>
      </span>
    </li>
  )
}

export function Glimpse(g: GlimpseProps) {
  const mentors = useListedMentors(Boolean(g.heroCards?.some((c) => c.match)))
  const login = { to: '/login' as const, search: { next: g.next } }
  return (
    <div className="min-h-screen bg-[#040a1e]">
      <Navbar dark />

      <main className="relative overflow-hidden bg-[radial-gradient(40rem_32rem_at_75%_15%,rgba(56,64,200,0.42),transparent_70%),radial-gradient(30rem_24rem_at_0%_30%,rgba(124,92,246,0.18),transparent_70%),radial-gradient(50rem_30rem_at_50%_100%,rgba(40,50,150,0.25),transparent_70%)]">
        {/* What it is, or what's trending when the page opens on that. */}
        {g.rolesFirst ? (
          <OpenRoles />
        ) : g.trendingFirst && g.trending ? (
          <Trending id={g.id} t={g.trending} first />
        ) : (
          <section className="mx-auto max-w-7xl px-4 pb-14 pt-12 sm:px-6 sm:pt-16 lg:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-[#8f6bff]/35 bg-[#1b2470]/40 px-3.5 py-1.5 text-[12.5px] font-semibold text-[#d8c9ff] backdrop-blur">
                  <g.icon size={14} className="text-[#b496ff]" /> {g.kicker}
                </p>
                <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.04] tracking-tight text-white sm:text-5xl xl:text-[3.6rem]">
                  {g.title} <span className={`block pb-1 ${gradientText}`}>{g.accent}</span>
                </h1>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/75">{g.body}</p>
                {g.tags && (
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {g.tags.map((t) => (
                      <li key={t} className="rounded-full border border-[#8f6bff]/35 bg-[#1b2470]/40 px-3.5 py-1.5 text-[13px] font-semibold text-[#d8c9ff]">
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    to="/signup"
                    onClick={() => trackEvent('glimpse_cta', { page: g.id, cta: 'signup' })}
                    className="press inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-[#7b6cf6] to-[#4f46e5] px-6 text-[15px] font-semibold text-white shadow-[0_10px_30px_-8px_rgba(99,102,241,0.9)] transition-opacity hover:opacity-90"
                  >
                    Get started free <ArrowRight size={18} />
                  </Link>
                  <Link
                    {...login}
                    onClick={() => trackEvent('glimpse_cta', { page: g.id, cta: 'login' })}
                    className="press inline-flex h-12 items-center rounded-xl border border-white/30 bg-white/[0.03] px-6 text-[15px] font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
                  >
                    I have an account
                  </Link>
                </div>
              </div>
              {g.heroCards ? (
                // Cards in place of the photo (Paul, 27 Oct 2026: the mentors' industries).
                <div className="relative">
                  <span aria-hidden className="absolute -inset-6 rounded-[2.5rem] bg-[#4c56f0]/25 blur-3xl" />
                  <ul className="relative grid grid-cols-2 gap-3 sm:gap-4">
                    {g.heroCards.map((c, i) => {
                      const fit = mentorsFor(c, mentors)
                      return (
                        <li
                          key={c.title}
                          className={`group relative flex min-h-[15rem] flex-col overflow-hidden rounded-3xl border bg-gradient-to-br p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(255,255,255,0.06),0_24px_60px_-24px_rgba(76,86,240,0.95)] backdrop-blur-2xl backdrop-saturate-150 transition-transform duration-300 hover:-translate-y-1 sm:p-5 ${TONES[c.tone].card} ${i % 2 ? 'sm:translate-y-6 sm:hover:translate-y-5' : ''}`}
                        >
                          {/* Liquid glass: a soft light from the top corner, a sheen across, colour pooling below. */}
                          <span aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_0%_0%,rgba(255,255,255,0.22),transparent_55%)]" />
                          <span aria-hidden className="pointer-events-none absolute -left-1/4 top-0 h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent transition-transform duration-700 group-hover:translate-x-[160%]" />
                          <span aria-hidden className="pointer-events-none absolute -bottom-10 -right-10 h-36 w-36 rounded-full bg-white/10 blur-3xl" />
                          <span className="relative flex items-center gap-3">
                            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-[0_0_24px_rgba(255,255,255,0.25)] ring-1 ring-white/30 ${TONES[c.tone].icon}`}>
                              <c.icon size={20} />
                            </span>
                            <span className="min-w-0">
                              <span className="block font-display text-[15px] font-bold leading-tight text-white sm:text-base">{c.title}</span>
                              <span className="mt-0.5 block text-[12px] leading-snug text-white/70">{c.body}</span>
                            </span>
                          </span>
                          {c.match && (
                            <span className="relative mt-auto block pt-4">
                              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">Mentors</span>
                              {fit === undefined ? (
                                <span aria-hidden className="mt-2 block h-[3.25rem] animate-pulse rounded-xl bg-white/[0.06]" />
                              ) : fit.length ? (
                                <ul className="mt-2 space-y-1.5">
                                  {fit.map((m) => (
                                    <MentorChip key={m.id} m={m} />
                                  ))}
                                </ul>
                              ) : (
                                <span className="mt-2 block rounded-xl border border-dashed border-white/20 px-3 py-3 text-[12px] text-white/60">
                                  Mentors joining soon
                                </span>
                              )}
                            </span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : (
                <figure className="relative mx-auto w-full max-w-md lg:max-w-none">
                  <span aria-hidden className="absolute -inset-6 rounded-[2.5rem] bg-[#4c56f0]/25 blur-3xl" />
                  <div className="relative overflow-hidden rounded-[2rem] border border-[#8f9bff]/25 shadow-[0_30px_80px_-30px_rgba(76,86,240,0.9)]">
                    <img src={`/home/${g.photo}.webp`} alt={g.photoAlt} className="h-80 w-full object-cover object-[50%_30%] sm:h-[26rem]" />
                    <span aria-hidden className="absolute inset-0 bg-[#3b3fd1]/20 mix-blend-color" />
                    <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#040a1e]/80 via-transparent to-transparent" />
                  </div>
                </figure>
              )}
            </div>
          </section>
        )}

        {g.trending && !g.trendingFirst && <Trending id={g.id} t={g.trending} />}

        {/* What you get. */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className={eyebrow}>What you get</p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {g.features.map((f) => (
              <li key={f.title} className={`${glass} p-5`}>
                <span className={tile}>
                  <f.icon size={20} />
                </span>
                <p className="mt-4 font-display text-[15px] font-semibold text-white">{f.title}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/65">{f.body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* How it works. */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className={eyebrow}>How it works</p>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {g.steps.map((s, i) => (
              <li key={s.title} className={`${glass} relative overflow-hidden p-6`}>
                <span aria-hidden className="absolute -right-1 -top-3 font-display text-7xl font-bold text-white/[0.06]">
                  0{i + 1}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b9a6ff]">Step {i + 1}</span>
                <p className="mt-2 font-display text-lg font-semibold text-white">{s.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-white/65">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* A look inside: locked until they sign in. */}
        <section className="mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6 lg:px-8">
          <div className={`${glass} relative overflow-hidden p-6 sm:p-8`}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className={eyebrow}>A look inside</p>
                <h2 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">{g.peek.title}</h2>
              </div>
              <p className="text-sm text-white/55">{g.peek.note}</p>
            </div>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.peek.items.map((it) => (
                <li
                  key={`${it.title}-${it.sub}`}
                  aria-hidden={!it.open}
                  className={`flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 ${it.open ? '' : 'select-none blur-[3px]'}`}
                >
                  {it.photo ? (
                    <img src={`/home/${it.photo}.webp`} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover object-[50%_25%]" />
                  ) : (
                    <span className={tile}>
                      <g.icon size={18} />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">{it.title}</span>
                    <span className="block truncate text-xs text-white/55">{it.sub}</span>
                  </span>
                </li>
              ))}
            </ul>
            {/* The lock, over the lower half. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#060b24] via-[#060b24]/80 to-transparent" />
            <div className="relative mt-6 flex flex-col items-center gap-3 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white">
                <Lock size={17} />
              </span>
              <p className="text-sm text-white/75">Sign up free to see everything inside.</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Link
                  to="/signup"
                  onClick={() => trackEvent('glimpse_cta', { page: g.id, cta: 'signup_peek' })}
                  className="press inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-ink-900 transition-colors hover:bg-brand-50"
                >
                  <Check size={15} /> Get started free
                </Link>
                <Link {...login} className="press inline-flex h-10 items-center rounded-xl border border-white/25 px-4 text-sm font-semibold text-white hover:bg-white/10">
                  Log in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

/** "Trending now": one programme or role, large, with the partner ribbon. */
function Trending({ id, t, first = false }: { id: GlimpseProps['id']; t: GlimpseTrending; first?: boolean }) {
  // At the top of the page it is the page's heading.
  const Heading = first ? 'h1' : 'h2'
  return (
    <section className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${first ? 'pb-10 pt-12 sm:pt-16' : 'pb-6'}`}>
      <div className="relative overflow-hidden rounded-3xl border border-[#f0a35e]/30 bg-gradient-to-br from-[#3a1f5c]/70 via-[#14123f]/70 to-[#0a0f2e]/80 p-6 shadow-[0_24px_70px_-30px_rgba(240,140,80,0.6)] backdrop-blur-xl sm:p-8">
        <span aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#f08c50]/20 blur-3xl" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_15rem]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#f97316] to-[#ec4899] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(249,115,22,0.5)]">
                <Flame size={13} /> Trending now
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/40 bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                <BadgeCheck size={13} /> {t.partner}
              </span>
            </div>
            <Heading className="mt-4 flex flex-wrap items-center gap-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {t.title}
              <Flag code={t.country} className="h-6 w-9" />
            </Heading>
            <p className="mt-1.5 text-sm font-medium text-[#f7c79c]">{t.where}</p>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75">{t.body}</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {t.points.map((pt) => (
                <li key={pt} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[13px] font-medium text-white/85">
                  <Check size={14} className="text-emerald-300" /> {pt}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/signup"
                onClick={() => trackEvent('glimpse_cta', { page: id, cta: 'trending_signup' })}
                className="press inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#f97316] to-[#ec4899] px-5 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(249,115,22,0.8)] transition-opacity hover:opacity-90"
              >
                Apply with MySkills <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                search={{ next: t.next }}
                onClick={() => trackEvent('glimpse_cta', { page: id, cta: 'trending_login' })}
                className="press inline-flex h-11 items-center rounded-xl border border-white/25 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Log in to see the programme
              </Link>
            </div>
          </div>
          {t.art === 'nurse' && (
            <div className="relative mx-auto hidden h-56 w-56 items-end justify-center overflow-hidden rounded-full bg-gradient-to-b from-[#f9a66c]/30 to-[#7c3aed]/20 ring-1 ring-white/15 lg:flex">
              <Nurse className="h-48 w-auto" />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
