import { useEffect, useRef, useState } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, Award, BadgeCheck, Briefcase, Check, GraduationCap, LayoutGrid, Sparkles } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'
import { requireGuest } from '@/lib/guards'
import { setAfterOnboarding } from '@/lib/afterOnboarding'
import {
  careerStageStep,
  goalStep,
  goalsFor,
  levelStep,
  planFor,
  type SentenceOption,
} from '@/lib/onboardingContent'
import { GOAL_ICONS } from '@/lib/goalIcons'
import { fetchAptitudeQuestions } from '@/lib/dmAptitude'
import { fetchAssessmentQuestions } from '@/lib/careerReadinessAssessment'
import { pendingAptitudeFor, savePendingAptitude, type TestRoute } from '@/lib/pendingAptitude'
import { peekGuideAnswers, saveGuideAnswers } from '@/lib/guideAnswers'
import { strongestFor } from '@/lib/guestResult'
import { setSiteMode } from '@/lib/siteMode'
import { isPhone } from '@/lib/device'
import type { LeadProgramme } from '@/lib/programmes'
import { InlineSelect } from '@/components/onboarding/InlineSelect'
import { AnswerPanel } from '@/components/onboarding/AnswerPanel'
import { ProgrammeLeadForm } from '@/components/programmes/ProgrammeLeadForm'
import { SignUpToSee } from '@/components/self-assessment/SignUpToSee'
import { SelfAssessmentQuiz, type QuizCopy, type QuizStatement } from '@/components/self-assessment/Quiz'
import { GlowOrb, GridBackdrop } from '@/components/landing/GridBackdrop'

/**
 * The AI guide: a visitor's way into MySkills on a computer, before any
 * account (Paul, 25 Oct 2026). The same fill-in-the-blanks sentence as
 * onboarding ("I'm [a student] and I want to [find a new job]…"), then the plan
 * it leads to, then that programme's aptitude test, right here. Signing up is
 * the last step, to see the results; the answers carry over (lib/
 * guideAnswers.ts, lib/pendingAptitude.ts), so onboarding isn't asked twice.
 *
 * "Standard website" switches to the usual site (lib/siteMode.ts).
 */
export const Route = createFileRoute('/start')({
  // Someone with an account has nothing to be onboarded into: home.
  beforeLoad: requireGuest,
  component: StartPage,
})

/** What a visitor can learn: the two open programmes, the two coming ones. */
const LEARN: SentenceOption[] = [
  { id: 'marketing', label: 'Digital Marketing', description: 'SEO, ads, content and analytics, practised on real scenarios.', chip: 'digital marketing' },
  { id: 'personal', label: 'Global Leadership', description: 'Communication, decisions and leading people: 14 skills employers hire for.', chip: 'global leadership' },
  { id: 'entrepreneurship', label: 'Entrepreneurship', description: 'Opens soon. Turn an idea into a business people pay for.', chip: 'entrepreneurship' },
  { id: 'data-analytics', label: 'Data Analytics', description: 'Opens soon. Spreadsheets, SQL and dashboards that answer real questions.', chip: 'data analytics' },
  { id: 'unsure', label: 'Not sure yet', description: 'I’ll suggest one from your goal.', chip: 'whatever you suggest' },
]
const COMING: Record<string, { lead: LeadProgramme; title: string }> = {
  entrepreneurship: { lead: 'entrepreneurship', title: 'Entrepreneurship' },
  'data-analytics': { lead: 'data-analytics', title: 'Data Analytics' },
}

const QUIZ_COPY: Record<TestRoute, QuizCopy> = {
  '/aptitude-assessment': {
    draftPrefix: 'myskills.dmAptitudeDraft',
    intro: 'One statement at a time. Say how often it’s true for you: there are no right answers, so answer as you really are.',
    closing: {
      title: 'Which part of marketing are you most curious about?',
      hint: 'In your own words. Optional, and not scored.',
      placeholder: 'e.g. How brands make an ad go viral…',
      ariaLabel: 'The part of marketing you are most curious about',
    },
  },
  '/career-readiness-assessment': {
    draftPrefix: 'myskills.lifeSkillsDraft',
    intro: 'One statement at a time. Say how often it’s true for you: it’s a starting point, not a test, so answer as you really are.',
    closing: {
      title: 'Which one skill would you most like to get better at?',
      hint: 'In your own words. Optional, and not scored.',
      placeholder: 'e.g. Staying calm when I’m criticised…',
      ariaLabel: 'The skill you most want to improve',
    },
  },
}

const isTest = (to: string): to is TestRoute => to === '/aptitude-assessment' || to === '/career-readiness-assessment'

/** Rings, as on the landing hero and onboarding: faint, top right. */
const Rings = () => (
  <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 opacity-[0.12]">
    <svg width="420" height="420" viewBox="0 0 200 200" fill="none" stroke="#f6e3c8" strokeWidth="1.2">
      <circle cx="100" cy="100" r="96" />
      <circle cx="100" cy="100" r="74" />
      <circle cx="100" cy="100" r="52" />
      <circle cx="100" cy="100" r="30" />
    </svg>
  </span>
)

/**
 * The sentence on a phone: one blank to a screen, each answer one tap. The
 * sentence builds at the top as it's answered; tapping a filled blank goes
 * back to it. Made for a thumb, not a dropdown.
 */
function PhoneSentence({
  values,
  blanks,
  onPick,
}: {
  values: string[]
  blanks: { question: string; placeholder: string; options: SentenceOption[] }[]
  /** The blank's index and the chosen option's id. */
  onPick: (i: number, id: string) => void
}) {
  const firstEmpty = values.findIndex((v) => !v)
  const [at, setAt] = useState(firstEmpty === -1 ? 0 : firstEmpty)
  const blank = blanks[at]
  const words = ['I’m', 'and I want to', '. I’d like to learn', ', and I’m']

  // Each blank starts at the top, as a new screen would.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [at])

  return (
    <div className="mt-5">
      {/* The sentence so far: filled blanks are chips to go back to. */}
      <p className="font-display text-[1.25rem] font-medium leading-[2.1] text-white">
        {words.map((w, i) => {
          const chosen = blanks[i].options.find((o) => o.id === values[i])
          return (
            <span key={w}>
              {i === 0 || /^[.,]/.test(w) ? '' : ' '}
              {w}{' '}
              <button
                type="button"
                onClick={() => i <= (firstEmpty === -1 ? 3 : firstEmpty) && setAt(i)}
                className={`rounded-lg px-2 py-0.5 ${
                  i === at
                    ? 'border border-dashed border-brand-300 text-brand-100'
                    : chosen
                      ? 'bg-brand-500/25 text-white'
                      : 'border border-dashed border-white/25 text-white/40'
                }`}
              >
                {chosen ? chosen.chip : blanks[i].placeholder}
              </button>
            </span>
          )
        })}
        .
      </p>

      <div className="mt-6 flex items-center gap-1.5" aria-hidden>
        {blanks.map((_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= at ? 'bg-brand-300' : 'bg-white/15'}`} />
        ))}
      </div>
      <h2 className="mt-4 font-display text-[1.5rem] font-semibold leading-tight text-white">{blank.question}</h2>
      <div className="mt-4 space-y-2.5">
        {blank.options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => {
              onPick(at, o.id)
              if (at < blanks.length - 1) setAt(at + 1)
            }}
            className={`press flex w-full items-center gap-3.5 rounded-2xl border p-4 text-left transition-colors active:bg-white/15 ${
              values[at] === o.id ? 'border-brand-300 bg-brand-500/20' : 'border-white/10 bg-white/[0.06]'
            }`}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-white">{o.label}</span>
              <span className="block text-sm leading-snug text-white/60">{o.description}</span>
            </span>
            {values[at] === o.id && <Check size={18} className="shrink-0 text-brand-200" />}
          </button>
        ))}
      </div>
      {at > 0 && (
        <button type="button" onClick={() => setAt(at - 1)} className="mt-4 inline-flex items-center gap-1.5 py-2 text-sm font-medium text-white/60">
          <ArrowLeft size={15} /> Back
        </button>
      )}
    </div>
  )
}

function StartPage() {
  const router = useRouter()

  // Back after the test, before signing up: the sentence as they left it, and
  // their results waiting. Read once, on arrival.
  const [arrival] = useState(() => {
    const g = peekGuideAnswers()
    const route: TestRoute | null = g ? (g.focus === 'marketing' ? '/aptitude-assessment' : '/career-readiness-assessment') : null
    return g && route && pendingAptitudeFor(route) ? { ...g, route } : null
  })

  const [stage, setStage] = useState(arrival?.stage ?? '')
  const [goal, setGoal] = useState(arrival?.goal ?? '')
  const [learn, setLearn] = useState<string>(arrival?.focus ?? '')
  const [level, setLevel] = useState(arrival?.level ?? '')
  const [asked, setAsked] = useState(Boolean(arrival))
  // The test they started from the plan, and whether it's done.
  const [test, setTest] = useState<TestRoute | null>(arrival?.route ?? null)
  const [done, setDone] = useState(Boolean(arrival))
  // The statements with their skill and reverse flag: the teaser is worked out from them.
  const [questions, setQuestions] = useState<(QuizStatement & { skill: string; reverse?: boolean })[] | null>(null)
  const [testError, setTestError] = useState<string>()
  const answerRef = useRef<HTMLDivElement>(null)
  const testRef = useRef<HTMLDivElement>(null)
  // A phone gets the sentence one blank to a screen, and no standard website.
  const phone = isPhone()

  const chosen = [stage, goal, learn, level].filter(Boolean).length
  const complete = chosen === 4
  const coming = COMING[learn]
  // The plan speaks of the open programmes; "not sure" lets the goal decide.
  const basePlan = complete && !coming ? planFor(stage, goal, learn, level) : null
  // "Based on" in the guide's own words: the programme by name.
  const plan = basePlan && {
    ...basePlan,
    basedOn: [
      careerStageStep.options.find((o) => o.id === stage)?.label,
      goalStep.options.find((o) => o.id === goal)?.label,
      LEARN.find((o) => o.id === learn)?.label,
      levelStep.options.find((o) => o.id === level)?.label,
    ].filter((x): x is string => Boolean(x)),
  }

  // Changing any choice withdraws the answer: it no longer matches the sentence.
  function pick(set: (v: string) => void) {
    return (id: string) => {
      set(id)
      setAsked(false)
      setTest(null)
      setDone(false)
    }
  }
  const goalOptions = goalsFor(stage)
  function pickStage(id: string) {
    if (goal && !goalsFor(id).some((o) => o.id === goal)) setGoal('')
    pick(setStage)(id)
  }

  // The plan, once asked for, comes into view: on a phone it opens below the
  // fold, so it goes to the top of the screen; after the panel has rendered.
  useEffect(() => {
    if (!asked || arrival) return
    const t = window.setTimeout(
      () => answerRef.current?.scrollIntoView({ behavior: 'smooth', block: phone ? 'start' : 'nearest' }),
      120,
    )
    return () => window.clearTimeout(t)
  }, [asked, arrival, phone])

  // The test's statements, once one is started.
  useEffect(() => {
    if (!test || done) return
    let active = true
    setQuestions(null)
    setTestError(undefined)
    const load = test === '/aptitude-assessment' ? fetchAptitudeQuestions() : fetchAssessmentQuestions().then((r) => r.questions)
    load
      .then((q) => {
        if (!active) return
        if (q.length === 0) setTestError('The test isn’t available right now. Please try again in a little while.')
        else setQuestions(q)
      })
      .catch(() => active && setTestError('The test isn’t available right now. Please try again in a little while.'))
    window.setTimeout(() => testRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
    return () => {
      active = false
    }
  }, [test, done])

  function remember(focus: 'marketing' | 'personal') {
    saveGuideAnswers({ stage, goal, focus, level: level === 'experienced' ? 'experienced' : 'beginner' })
  }

  function standard() {
    setSiteMode('standard')
    trackEvent('site_mode', { mode: 'standard' })
    router.navigate({ to: '/' })
  }

  /** A blank answered on a phone; the last one asks for the plan. */
  function pickOnPhone(i: number, id: string) {
    if (i === 0) pickStage(id)
    else if (i === 1) pick(setGoal)(id)
    else if (i === 2) pick(setLearn)(id)
    else {
      pick(setLevel)(id)
      trackEvent('guide_ask', { stage, goal, learn, level: id, phone: true })
      setAsked(true)
    }
  }

  function ask() {
    if (!complete) return
    trackEvent('guide_ask', { stage, goal, learn, level })
    setAsked(true)
  }

  /** A button on the plan: a test starts here; the Foundation needs an account first. */
  function start(to: string) {
    if (!plan) return
    if (isTest(to)) {
      trackEvent('guide_test', { test: to })
      setTest(to)
      return
    }
    // The Foundation assessment is graded and kept, so it is taken signed in.
    remember('marketing')
    setAfterOnboarding(to)
    trackEvent('guide_signup', { to })
    router.navigate({ to: '/signup' })
  }

  return (
    <div className="surface-wood-dark relative min-h-screen overflow-hidden">
      <GridBackdrop mask="ellipse 80% 60% at 50% 0%" />
      <Rings />
      <GlowOrb className="-left-24 top-24 h-72 w-72" />
      <GlowOrb className="-right-24 bottom-0 h-72 w-72" color="rgba(211,164,65,0.10)" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex items-center justify-between gap-3">
          <Link to="/start" className="flex items-center gap-2.5">
            <span className="font-display text-lg font-semibold tracking-tight text-white">MySkills</span>
          </Link>
          <div className="flex items-center gap-4">
            {/* The two ways in: this one, and the website as it always was (a computer only). */}
            <div className={`${phone ? 'hidden' : 'flex'} rounded-full bg-white/10 p-1 text-xs font-semibold`} role="group" aria-label="Experience">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-ink-900">
                <Sparkles size={13} /> AI guide
              </span>
              <button type="button" onClick={standard} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-white/75 hover:text-white">
                <LayoutGrid size={13} /> Standard website
              </button>
            </div>
            <Link to="/login" className="text-sm font-semibold text-white/80 hover:text-white">
              Sign in
            </Link>
          </div>
        </header>

        <main className="flex flex-1 flex-col justify-center py-6 sm:py-10">
          <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-mono text-xs font-medium text-white/85">
            <span className="relative flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Personal &amp; professional development, powered by AI
          </span>
          <h1 className="font-display text-3xl font-semibold leading-[1.15] tracking-tight text-white sm:text-4xl">
            Let’s find your starting point
          </h1>
          <p className="mt-2.5 max-w-xl text-base leading-relaxed text-white/70">
            {phone
              ? 'Four quick taps and I’ll show you where to begin. Free, and no account needed yet.'
              : 'Complete the sentence, choose from each dropdown, and I’ll show you where to begin. Free, and no account needed yet.'}
          </p>

          {phone && !asked && (
            <PhoneSentence
              values={[stage, goal, learn, level]}
              blanks={[
                { question: 'Where are you right now?', placeholder: 'where you are', options: careerStageStep.options },
                { question: 'What do you want most right now?', placeholder: 'your goal', options: goalOptions },
                { question: 'What would you like to learn?', placeholder: 'a programme', options: LEARN },
                { question: 'How much do you already know?', placeholder: 'how much you know', options: levelStep.options },
              ]}
              onPick={pickOnPhone}
            />
          )}

          {/* The prompt: a sentence with four dropdowns in it (on a phone, once answered: to change). */}
          <div className={`${phone && !asked ? 'hidden' : ''} card-glass-dark relative mt-7 rounded-2xl p-5 transition-shadow duration-500 sm:p-7 ${complete ? 'glow-edge' : ''}`}>
            <p className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-white/50">Your starting point</p>
            <div className="font-display text-[1.375rem] font-medium leading-[2.35] text-white sm:text-[1.75rem] sm:leading-[2.3]">
              I’m{' '}
              <InlineSelect value={stage} options={careerStageStep.options} onChange={pickStage} placeholder="where you are" label="Where you are right now" />{' '}
              and I want to{' '}
              <InlineSelect
                value={goal}
                options={goalOptions}
                onChange={pick(setGoal)}
                placeholder="your goal"
                label="The one goal you want to work towards"
                icon={(id) => {
                  const Icon = GOAL_ICONS[goalStep.options.find((o) => o.id === id)?.icon ?? 'sparkles']
                  return <Icon size={16} />
                }}
              />
              . I’d like to learn{' '}
              <InlineSelect value={learn} options={LEARN} onChange={pick(setLearn)} placeholder="a programme" label="What you'd like to learn" />
              , and I’m{' '}
              <InlineSelect value={level} options={levelStep.options} onChange={pick(setLevel)} placeholder="how much you know" label="How much you already know" />.
            </div>

            <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
              <p className="flex items-center gap-2 font-mono text-xs text-white/50" aria-live="polite">
                <span className="flex gap-1" aria-hidden>
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-5 rounded-full transition-colors duration-300 ${i < chosen ? 'bg-brand-300 shadow-[0_0_8px_rgba(143,133,238,0.7)]' : 'bg-white/15'}`}
                    />
                  ))}
                </span>
                {chosen} of 4 chosen
              </p>
              <button
                type="button"
                onClick={ask}
                disabled={!complete || asked}
                className="press inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-ink-900 shadow-e2 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Sparkles size={16} />
                Show me my plan
              </button>
            </div>
          </div>

          {/* What a first-time visitor should know before trusting the sentence with anything. */}
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/70">
            {[
              { icon: BadgeCheck, label: 'Free to start' },
              { icon: GraduationCap, label: 'Verified mentors' },
              { icon: Briefcase, label: 'Real internships' },
              { icon: Award, label: 'Certificates you can share' },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-1.5">
                <Icon size={15} className="text-brand-200" />
                {label}
              </li>
            ))}
          </ul>

          {/* Partners have a way in from here too: every partner page leads to the portal's sign-up. */}
          <p className="mt-3 text-sm text-white/55">
            A mentor, company or institute?{' '}
            <Link to="/community" search={{ partners: true }} className="font-semibold text-white underline-offset-4 hover:underline">
              Partner with MySkills
            </Link>
          </p>

          <div ref={answerRef}>
            {/* A programme that isn't open yet: a place on its list, and the open ones meanwhile. */}
            {asked && coming && (
              <section className="glow-edge card-glass-dark mt-6 rounded-2xl p-5 sm:p-7">
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-brand-200">Opens soon</p>
                <p className="mt-3 font-display text-xl font-semibold leading-snug text-white sm:text-2xl">
                  {coming.title} isn’t open yet. Leave your number and we’ll call you as soon as it is.
                </p>
                <div className="max-w-md">
                  <ProgrammeLeadForm programme={coming.lead} title={coming.title} start="guide" />
                </div>
                <p className="mt-5 text-sm text-white/65">Meanwhile, start one that’s open today:</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(['marketing', 'personal'] as const).map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setLearn(id)
                        setAsked(true)
                      }}
                      className="press rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                    >
                      {id === 'marketing' ? 'Digital Marketing' : 'Global Leadership'}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {asked && plan && !test && (
              <AnswerPanel key={`${stage}|${goal}|${learn}|${level}`} plan={plan} busy={false} onPick={start} onSkip={phone ? undefined : standard} />
            )}
          </div>

          {/* The test, right here; then the results, for an account. */}
          {test && (
            <div ref={testRef} className="mt-6 scroll-mt-6">
              {done ? (
                <SignUpToSee route={test} />
              ) : (
                <>
                  {testError && <p className="rounded-xl bg-rose-500/15 p-3 text-sm text-rose-100">{testError}</p>}
                  {!testError && !questions && <p className="text-sm text-white/60">Getting the test ready…</p>}
                  {questions && (
                    <SelfAssessmentQuiz
                      questions={questions}
                      copy={QUIZ_COPY[test]}
                      onSubmit={async (answers, reflection) => {
                        savePendingAptitude(test, answers, reflection, strongestFor(test, questions, answers))
                        remember(test === '/aptitude-assessment' ? 'marketing' : 'personal')
                        trackEvent('aptitude_answered_guest', { test, start: 'guide' })
                        setDone(true)
                      }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setTest(null)}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-white/60 hover:text-white"
                  >
                    Back to my plan <ArrowRight size={14} className="rotate-180" />
                  </button>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
