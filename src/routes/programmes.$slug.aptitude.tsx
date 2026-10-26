import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { guestOrOnboarded } from '@/lib/guards'
import { errorMessage } from '@/lib/errors'
import { trackEvent } from '@/lib/analytics'
import { useAuthUser } from '@/lib/useAuth'
import { enrol, fetchGuestAptitude, submitAptitude, type GuestAptitude } from '@/lib/programmeStudent'
import { clearPendingAptitude, pendingAptitudeFor, savePendingAptitude, type EngineTestRoute } from '@/lib/pendingAptitude'
import { strongestFor } from '@/lib/guestResult'
import { DarkError, DarkShell } from '@/components/self-assessment/DarkShell'
import { SelfAssessmentQuiz } from '@/components/self-assessment/Quiz'
import { SignUpToSee } from '@/components/self-assessment/SignUpToSee'
import { PageHeader } from '@/components/app/PageHeader'
import { ProgrammeFrame, previewSearch, useMyProgramme } from '@/components/programme/shared'
import { Button } from '@/components/ui'

// Open to a visitor too: the test comes before the account, as for Digital
// Marketing and Global Leadership (lib/pendingAptitude.ts). Signed in, it is
// like any programme page: onboarding first.
export const Route = createFileRoute('/programmes/$slug/aptitude')({
  beforeLoad: guestOrOnboarded,
  validateSearch: previewSearch,
  component: AptitudePage,
})

const SCALE = ['Never', 'Sometimes', 'Often', 'Always'] as const

/** A stable shuffle, so skills are mixed but the order doesn't jump on every render. */
function mixed<T extends { id: string }>(items: T[]): T[] {
  const h = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
  return [...items].sort((a, b) => h(a.id) - h(b.id))
}

/** Signed out: the test, then "your results are ready". Signed in with
 *  answers from before: enrol, score them, and on to the programme. */
function AptitudePage() {
  const { slug } = Route.useParams()
  const { user, loading } = useAuthUser()
  if (loading) return null
  return user ? <SignedInAptitude slug={slug} /> : <GuestAptitudePage slug={slug} />
}

function GuestAptitudePage({ slug }: { slug: string }) {
  const route: EngineTestRoute = `/programmes/${slug}/aptitude`
  const [g, setG] = useState<GuestAptitude | null | undefined>(undefined)
  const [done, setDone] = useState(() => pendingAptitudeFor(route) !== null)

  useEffect(() => {
    let active = true
    fetchGuestAptitude(slug).then((r) => active && setG(r))
    return () => {
      active = false
    }
  }, [slug])

  const names = useMemo(() => Object.fromEntries((g?.skills ?? []).map((s) => [s.id, s.name])), [g])

  return (
    <DarkShell
      back={{ to: '/', label: 'Back' }}
      eyebrow={g?.title ?? 'Aptitude test'}
      title="How do you work today?"
      description="Before any lessons: a quick, honest look at the skills this programme builds. There are no right answers."
    >
      {done ? (
        <SignUpToSee route={route} />
      ) : g === undefined ? (
        <p className="flex items-center gap-2 text-sm text-white/60">
          <Loader2 size={15} className="animate-spin" /> Loading…
        </p>
      ) : g === null ? (
        <DarkError title="The test isn’t available right now." message="Please try again in a little while." />
      ) : (
        <SelfAssessmentQuiz
          questions={g.items}
          copy={{
            draftPrefix: `myskills.programmeAptitude.${slug}`,
            intro: 'You’ll see one statement at a time. Say how often it’s true for you: answer as you really are. Your modules start with the skills you rate lowest.',
          }}
          onSubmit={async (answers) => {
            savePendingAptitude(route, answers, '', strongestFor(route, g.items, answers, names))
            trackEvent('aptitude_answered_guest', { programme: slug })
            setDone(true)
            window.scrollTo({ top: 0 })
          }}
        />
      )}
    </DarkShell>
  )
}

function SignedInAptitude({ slug }: { slug: string }) {
  const route: EngineTestRoute = `/programmes/${slug}/aptitude`
  const navigate = useNavigate()
  // Answers from before signing up: start the programme, score them, show it.
  const [scoring] = useState(() => pendingAptitudeFor(route))
  useEffect(() => {
    if (!scoring) return
    clearPendingAptitude()
    enrol(slug)
      .then(() => submitAptitude(slug, scoring.answers))
      .then(() => trackEvent('programme_aptitude_complete', { programme: slug, start: 'guest' }))
      // Already taken on this account, or saved a moment ago: the programme page shows where they stand.
      .catch(() => {})
      .finally(() => void navigate({ to: '/programmes/$slug', params: { slug } }))
  }, [scoring, slug, navigate])
  if (scoring) {
    return (
      <DarkShell back={{ to: '/dashboard', label: 'LaunchPad' }} eyebrow="Your results" title="Working out your results…" description="Starting your programme with the answers you gave.">
        <p className="flex items-center gap-2 text-sm text-white/60">
          <Loader2 size={15} className="animate-spin" /> One moment…
        </p>
      </DarkShell>
    )
  }
  return <MemberAptitude slug={slug} />
}

function MemberAptitude({ slug }: { slug: string }) {
  const preview = Boolean(Route.useSearch().preview)
  const navigate = useNavigate()
  const { p, error } = useMyProgramme(slug, preview)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState<string>()
  const items = useMemo(() => mixed(p?.content.aptitude.items ?? []), [p])

  return (
    <ProgrammeFrame slug={slug} preview={preview} back="programme" p={p} error={error}>
      {(p) => {
        const answered = items.filter((i) => answers[i.id]).length
        return (
          <div className="space-y-4">
            <PageHeader
              eyebrow={`${p.title} · Aptitude test`}
              title="How do you work today?"
              description="Answer honestly: there are no right answers. Your modules will start with the skills you rate lowest."
            />
            <ol className="space-y-3">
              {items.map((it, i) => (
                <li key={it.id} className="card p-4 sm:p-5">
                  <p className="text-sm font-medium text-ink-900">
                    <span className="mr-1 text-ink-400">{i + 1}.</span> {it.statement}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label={it.statement}>
                    {SCALE.map((label, v) => (
                      <button
                        key={label}
                        type="button"
                        role="radio"
                        aria-checked={answers[it.id] === v + 1}
                        onClick={() => setAnswers((a) => ({ ...a, [it.id]: v + 1 }))}
                        className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                          answers[it.id] === v + 1 ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
            <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-2xl border border-ink-200 bg-white/95 p-3 shadow-e2 backdrop-blur">
              <span className="text-sm text-ink-600">
                {answered} of {items.length} answered
              </span>
              {saveError && <span className="text-sm text-red-700">{saveError}</span>}
              <Button
                className="ml-auto"
                disabled={busy || answered < items.length}
                onClick={() => {
                  if (preview) {
                    void navigate({ to: '/programmes/$slug', params: { slug }, search: { preview: 1 } })
                    return
                  }
                  setBusy(true)
                  setSaveError(undefined)
                  submitAptitude(slug, answers)
                    .then(() => navigate({ to: '/programmes/$slug', params: { slug } }))
                    .catch((e) => {
                      setSaveError(errorMessage(e))
                      setBusy(false)
                    })
                }}
              >
                {busy ? 'Saving…' : 'See my results'}
              </Button>
            </div>
          </div>
        )
      }}
    </ProgrammeFrame>
  )
}
