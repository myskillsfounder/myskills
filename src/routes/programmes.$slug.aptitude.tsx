import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { guestOrOnboarded } from '@/lib/guards'
import { trackEvent } from '@/lib/analytics'
import { useAuthUser } from '@/lib/useAuth'
import { enrol, fetchGuestAptitude, submitAptitude, type GuestAptitude } from '@/lib/programmeStudent'
import { clearPendingAptitude, pendingAptitudeFor, savePendingAptitude, type EngineTestRoute } from '@/lib/pendingAptitude'
import { strongestFor } from '@/lib/guestResult'
import { DarkError, DarkShell } from '@/components/self-assessment/DarkShell'
import { SelfAssessmentQuiz } from '@/components/self-assessment/Quiz'
import { SignUpToSee } from '@/components/self-assessment/SignUpToSee'
import { previewSearch, useMyProgramme } from '@/components/programme/shared'

// Open to a visitor too: the test comes before the account, as for Digital
// Marketing and Global Leadership (lib/pendingAptitude.ts). Signed in, it is
// like any programme page: onboarding first.
export const Route = createFileRoute('/programmes/$slug/aptitude')({
  beforeLoad: guestOrOnboarded,
  validateSearch: previewSearch,
  component: AptitudePage,
})

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

/** Signed in, the same focused screen a visitor and the built-in programmes'
 *  tests use: one statement at a time, saved as a draft as they go. */
function MemberAptitude({ slug }: { slug: string }) {
  const preview = Boolean(Route.useSearch().preview)
  const navigate = useNavigate()
  const { p, error } = useMyProgramme(slug, preview)
  const items = useMemo(() => mixed(p?.content.aptitude.items ?? []), [p])
  const search = preview ? { preview: 1 as const } : {}
  const toProgramme = () => void navigate({ to: '/programmes/$slug', params: { slug }, search })

  // Taken already: the programme page shows the result.
  const taken = Boolean(p?.aptitude) && !preview
  useEffect(() => {
    if (taken) toProgramme()
  })

  return (
    <DarkShell
      back={{ to: '/programmes/$slug', params: { slug }, search, label: p?.title ?? 'Back' }}
      eyebrow={p ? `${p.title} · Aptitude test` : 'Aptitude test'}
      title="How do you work today?"
      description="Before any lessons: a quick, honest look at the skills this programme builds. There are no right answers."
    >
      {error ? (
        <DarkError title="The test isn’t available right now." message={error} />
      ) : !p || taken ? (
        <p className="flex items-center gap-2 text-sm text-white/60">
          <Loader2 size={15} className="animate-spin" /> Loading…
        </p>
      ) : items.length === 0 ? (
        <DarkError title="No aptitude test yet." message="This programme’s test isn’t ready. Its modules are open." />
      ) : (
        <SelfAssessmentQuiz
          questions={items}
          copy={{
            draftPrefix: preview ? `myskills.programmeAptitude.preview.${slug}` : `myskills.programmeAptitude.${slug}`,
            intro: 'You’ll see one statement at a time. Say how often it’s true for you: answer as you really are. Your modules start with the skills you rate lowest.',
          }}
          onSubmit={async (answers) => {
            // Staff trying a draft: nothing is saved.
            if (!preview) {
              await submitAptitude(slug, answers)
              trackEvent('programme_aptitude_complete', { programme: slug, start: 'member' })
            }
            toProgramme()
          }}
        />
      )}
    </DarkShell>
  )
}
