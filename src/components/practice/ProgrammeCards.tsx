import { Link } from '@tanstack/react-router'
import { ArrowRight, Bell, Globe2, Layers, Megaphone, Plus, Rocket, Sparkles, type LucideIcon } from 'lucide-react'
import { COURSES, type Course } from '@/content/courses'
import { resolveGoal } from '@/lib/onboardingContent'
import type { CourseProgress } from '@/lib/programmes'
import type { MyEnrolment } from '@/lib/programmeStudent'
import type { Programme } from '@/lib/practiceProgramme'

/*
 * Practice's home: a card for every programme the student has joined (Paul,
 * 27 Oct 2026: "there are more than two programmes, so Practice should show
 * the enrolled programme cards, and clicking one should take them to its
 * progress and practice"). Digital Marketing and Global Leadership open their
 * page here; a course-engine programme opens its own page. Then a card to add
 * another programme from the courses.
 */

interface Card {
  key: string
  name: string
  kind: 'Professional' | 'Personal'
  icon: LucideIcon
  tile: string
  percent: number
  status: string
  detail: string
}

const ENGINE_LOOK: Record<string, { icon: LucideIcon; tile: string }> = {
  'ai-powered-entrepreneurship': { icon: Rocket, tile: 'from-rose-400 to-pink-600' },
}

/** An engine programme's progress: the aptitude test, each module, the Foundation assessment. */
function engineProgress(e: MyEnrolment): Pick<Card, 'percent' | 'status' | 'detail'> {
  const steps = 1 + e.modules_total + 1
  const done = (e.aptitude_done ? 1 : 0) + Math.min(e.modules_done, e.modules_total) + (e.final_passed ? 1 : 0)
  return {
    percent: Math.round((done / steps) * 100),
    status: done === 0 ? 'Not started' : done >= steps ? 'Complete' : 'In progress',
    detail: !e.aptitude_done
      ? 'Take the aptitude test to begin'
      : e.modules_done < e.modules_total
        ? `${e.modules_done} of ${e.modules_total} modules finished`
        : e.final_passed
          ? 'Foundation assessment passed'
          : 'Modules done · take the Foundation assessment',
  }
}

function Ring({ percent }: { percent: number }) {
  const r = 22
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90" aria-hidden>
      <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-ink-900/[0.08]" />
      <circle
        cx="28"
        cy="28"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (c * percent) / 100}
        className="text-brand-600 transition-[stroke-dashoffset] duration-700"
      />
    </svg>
  )
}

function CardBody({ c }: { c: Card }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-e1 ring-1 ring-white/30 ${c.tile}`}>
          <c.icon size={22} />
        </span>
        <span className="relative flex h-14 w-14 items-center justify-center">
          <Ring percent={c.percent} />
          <span className="absolute font-display text-[13px] font-semibold text-ink-900">{c.percent}%</span>
        </span>
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">{c.kind} skills</p>
      <h3 className="mt-1 font-display text-lg font-semibold leading-snug text-ink-900">{c.name}</h3>
      <p className="mt-1.5 text-sm text-ink-600">{c.detail}</p>
      <span className="mt-auto flex items-center justify-between pt-5">
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            c.status === 'Complete' ? 'bg-emerald-50 text-emerald-700' : c.status === 'In progress' ? 'bg-brand-50 text-brand-700' : 'bg-ink-900/[0.05] text-ink-600'
          }`}
        >
          {c.status}
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
          Continue <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </span>
    </>
  )
}

const cardClass = 'lift group flex h-full flex-col rounded-2xl border border-ink-900/[0.08] bg-white p-5 text-left shadow-e1'

export function ProgrammeCards({
  dm,
  cr,
  engine,
  onOpen,
}: {
  /** The built-in programmes, when the student has started them. */
  dm: CourseProgress | null
  cr: CourseProgress | null
  /** Course-engine enrolments; undefined while loading. */
  engine: MyEnrolment[] | undefined
  onOpen: (p: Programme) => void
}) {
  const builtIn: (Card & { programme: Programme })[] = []
  if (dm) builtIn.push({ ...dm, key: 'dm', programme: 1, name: 'Digital Marketing', kind: 'Professional', icon: Megaphone, tile: 'from-brand-400 to-brand-700' })
  if (cr) builtIn.push({ ...cr, key: 'cr', programme: 2, name: 'Global Leadership', kind: 'Personal', icon: Globe2, tile: 'from-amber-400 to-orange-500' })

  return (
    <section aria-labelledby="my-programmes">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-700">Practice</p>
          <h1 id="my-programmes" className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            Your programmes
          </h1>
          <p className="mt-1 text-sm text-ink-600">Choose a programme to see your progress and keep practising.</p>
        </div>
      </div>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {builtIn.map((c) => (
          <li key={c.key}>
            <button type="button" onClick={() => onOpen(c.programme)} className={`${cardClass} w-full`}>
              <CardBody c={c} />
            </button>
          </li>
        ))}
        {engine?.map((e) => {
          const look = ENGINE_LOOK[e.slug] ?? { icon: Layers, tile: 'from-sky-400 to-brand-600' }
          const c: Card = {
            key: e.slug,
            name: e.title,
            kind: e.kind === 'personal' ? 'Personal' : 'Professional',
            ...look,
            ...engineProgress(e),
          }
          return (
            <li key={e.slug}>
              <Link to="/programmes/$slug" params={{ slug: e.slug }} className={cardClass}>
                <CardBody c={c} />
              </Link>
            </li>
          )
        })}
        {engine === undefined && (
          <li aria-hidden className="h-full min-h-[14rem] animate-pulse rounded-2xl bg-ink-900/[0.04]" />
        )}
        <li>
          <Link
            to="/courses"
            className="lift group flex h-full min-h-[14rem] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-ink-900/15 p-5 text-center text-ink-600 transition-colors hover:border-brand-300 hover:text-brand-700"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-900/[0.05] group-hover:bg-brand-50">
              <Plus size={22} />
            </span>
            <span className="font-display text-base font-semibold">Add a programme</span>
            <span className="text-sm">Browse every course and take its free aptitude test.</span>
          </Link>
        </li>
      </ul>
    </section>
  )
}

/**
 * Which courses suit each goal from onboarding, best first (Paul, 27 Oct 2026:
 * "show recommended programmes based on your goal"). A goal not listed, or no
 * goal, gets the courses in their usual order.
 */
const FOR_GOAL: Record<string, Course['id'][]> = {
  job: ['global-leadership', 'digital-marketing', 'data-analytics', 'entrepreneurship'],
  business: ['entrepreneurship', 'digital-marketing', 'global-leadership', 'data-analytics'],
  skill: ['digital-marketing', 'data-analytics', 'entrepreneurship', 'global-leadership'],
  grow: ['global-leadership', 'data-analytics', 'digital-marketing', 'entrepreneurship'],
  freelance: ['digital-marketing', 'entrepreneurship', 'data-analytics', 'global-leadership'],
  confidence: ['global-leadership', 'entrepreneurship', 'digital-marketing', 'data-analytics'],
  mentor: ['global-leadership', 'digital-marketing', 'entrepreneurship', 'data-analytics'],
  practise: ['digital-marketing', 'data-analytics', 'global-leadership', 'entrepreneurship'],
  assess: ['digital-marketing', 'global-leadership', 'entrepreneurship', 'data-analytics'],
}

/** The engine programme behind a course, by the slug in its test's address. */
const engineSlugOf = (c: Course) => c.test?.match(/^\/programmes\/([a-z0-9-]+)\//)?.[1]

/** Up to three courses the student hasn't joined, in the order that suits their goal. */
export function recommendFor(goalId: string | undefined, joined: { dm: boolean; cr: boolean; engine: string[] }): Course[] {
  const goal = resolveGoal(goalId)
  const order = (goal && FOR_GOAL[goal.id]) || COURSES.map((c) => c.id)
  const isJoined = (c: Course) =>
    (c.id === 'digital-marketing' && joined.dm) ||
    (c.id === 'global-leadership' && joined.cr) ||
    Boolean(engineSlugOf(c) && joined.engine.includes(engineSlugOf(c)!))
  return order
    .map((id) => COURSES.find((c) => c.id === id))
    .filter((c): c is Course => Boolean(c) && !isJoined(c!))
    .slice(0, 3)
}

export function RecommendedProgrammes({ goalId, courses }: { goalId: string | undefined; courses: Course[] }) {
  if (courses.length === 0) return null
  const goal = resolveGoal(goalId)
  return (
    <section aria-labelledby="recommended" className="mt-10">
      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-700">
        <Sparkles size={13} /> Recommended for you
      </p>
      <h2 id="recommended" className="mt-1 font-display text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">
        {goal ? <>For your goal: {goal.you}</> : 'Programmes to add next'}
      </h2>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {courses.map((c, i) => {
          const open = c.status === 'open'
          return (
            <li key={c.id} className="relative flex h-full flex-col rounded-2xl border border-ink-900/[0.08] bg-gradient-to-br from-white to-brand-50/40 p-5 shadow-e1">
              {i === 0 && goal && (
                <span className="absolute right-4 top-4 rounded-full bg-brand-600 px-2.5 py-1 text-[11px] font-semibold text-white">Best fit</span>
              )}
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-e1 ring-1 ring-white/30 ${c.tile}`}>
                <c.icon size={22} />
              </span>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
                {c.kind === 'personal' ? 'Personal' : 'Professional'} skills · {open ? 'Open' : 'Opens soon'}
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold leading-snug text-ink-900">{c.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{c.tagline}</p>
              <div className="mt-auto pt-5">
                {open && c.test ? (
                  <a
                    href={c.test}
                    className="press inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-brand-700"
                  >
                    Take the free aptitude test <ArrowRight size={15} />
                  </a>
                ) : (
                  <Link
                    to="/courses"
                    className="press inline-flex h-10 items-center gap-1.5 rounded-xl border border-ink-900/15 px-4 text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-900/[0.04]"
                  >
                    <Bell size={15} /> Tell me when it opens
                  </Link>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
