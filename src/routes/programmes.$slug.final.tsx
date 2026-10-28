import { useEffect, useState, type ReactNode } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, Award, Clock, Eye, Loader2, Lock } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { TIERS } from '@/lib/certificates'
import { gradeLocally, submitFinal, type MyProgramme } from '@/lib/programmeStudent'
import { DarkError, DarkShell } from '@/components/self-assessment/DarkShell'
import { previewSearch, useMyProgramme } from '@/components/programme/shared'
import { DARK_TIER, FocusedQuiz, darkPrimaryButton } from '@/components/programme/FocusedQuiz'

// On the dark test screen, like every aptitude test and Digital Marketing's
// Foundation assessment: a test looks the same in every programme.
export const Route = createFileRoute('/programmes/$slug/final')({
  beforeLoad: requireOnboarded,
  validateSearch: previewSearch,
  component: FinalPage,
})

/** Minutes left, counting down from when the student pressed Start. */
function Countdown({ minutes, onEnd }: { minutes: number; onEnd: () => void }) {
  const [left, setLeft] = useState(minutes * 60)
  useEffect(() => {
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [])
  useEffect(() => {
    if (left === 0) onEnd()
  }, [left, onEnd])
  const mm = Math.floor(left / 60)
  const ss = String(left % 60).padStart(2, '0')
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold tabular-nums ${
        left < 120 ? 'bg-red-500/20 text-red-200' : 'bg-white/10 text-white/80'
      }`}
    >
      <Clock size={12} /> {mm}:{ss}
    </span>
  )
}

/** A dark card for the page's other states: taken, locked, before you start. */
function Panel({ children }: { children: ReactNode }) {
  return <div className="card-glass-dark glow-edge mx-auto max-w-2xl rounded-xl p-6 sm:p-8">{children}</div>
}

function Final({ p, preview, reload, backTo }: { p: MyProgramme; preview: boolean; reload: () => Promise<void>; backTo: () => void }) {
  const { slug } = Route.useParams()
  const [started, setStarted] = useState(false)
  const [timeUp, setTimeUp] = useState(false)
  // Just submitted: keep the result and the review on screen.
  const [taken, setTaken] = useState(false)
  const f = p.content.final

  if (f.questions.length === 0) {
    return <DarkError title="No Foundation assessment yet." message="This programme’s Foundation assessment isn’t ready. Keep going with the modules." />
  }
  if (p.final && !taken) {
    const t = TIERS[p.final.kind]
    return (
      <Panel>
        <p className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${DARK_TIER[p.final.kind]}`}>
          <Award size={15} /> {t.certLabel}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-white/75">
          You took the Foundation assessment on{' '}
          {new Date(p.final.completed_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })} and scored{' '}
          {p.final.percent}%. It is taken once, and it earned your Foundation certificate in {p.title}.
        </p>
        <CertificateLink slug={p.slug} />
      </Panel>
    )
  }
  if (!p.foundation_unlocked && !preview) {
    return (
      <Panel>
        <p className="inline-flex items-center gap-2 font-display text-lg font-semibold text-white">
          <Lock size={17} className="text-brand-200" /> Finish the foundation modules first
        </p>
        <p className="mt-2 text-sm leading-relaxed text-white/70">The Foundation assessment opens once each foundation module is done.</p>
        <button type="button" onClick={backTo} className={`mt-5 ${darkPrimaryButton}`}>
          Back to {p.title} <ArrowRight size={16} />
        </button>
      </Panel>
    )
  }
  if (!started) {
    return (
      <Panel>
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-brand-200">[ Before you start ]</p>
        <p className="mt-3 font-display text-2xl font-semibold text-white">
          {f.questions.length} questions. {f.minutes} minutes.
        </p>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-white/75">
          <li>One question at a time, on the foundations of every skill in the programme.</li>
          <li>
            You take it once. Every finished attempt earns a Foundation certificate: Gold from {TIERS.gold.min}%, Silver from {TIERS.silver.min}%,
            Bronze below that.
          </li>
          <li>Once you start, the timer runs. When it ends, answer anything left and submit straight away.</li>
        </ul>
        <button type="button" onClick={() => setStarted(true)} className={`mt-6 ${darkPrimaryButton}`}>
          Start <ArrowRight size={16} />
        </button>
      </Panel>
    )
  }
  return (
    <>
      {timeUp && !taken && (
        <p role="alert" className="mx-auto mb-4 max-w-2xl rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <span className="font-semibold">Time is up.</span> Answer any questions left and submit now.
        </p>
      )}
      <FocusedQuiz
        questions={f.questions}
        aside={!timeUp && !taken ? <Countdown minutes={f.minutes} onEnd={() => setTimeUp(true)} /> : null}
        resultNote={(r) =>
          r.certificate ? <CertificateLink slug={p.slug} /> : <p className="mt-4 text-sm text-white/55">Preview: no certificate is issued.</p>
        }
        onSubmit={async (answers) => {
          if (preview) return gradeLocally(f.questions, answers)
          const r = await submitFinal(slug, answers)
          setTaken(true)
          void reload()
          return r
        }}
        onDone={backTo}
        doneLabel={`Back to ${p.title}`}
      />
    </>
  )
}

function CertificateLink({ slug }: { slug: string }) {
  return (
    <Link to="/certificate" search={{ programme: slug }} className={`mt-5 ${darkPrimaryButton}`}>
      See your certificate <ArrowRight size={15} />
    </Link>
  )
}

/** The Foundation assessment: one timed test on the foundations of every skill. */
function FinalPage() {
  const { slug } = Route.useParams()
  const preview = Boolean(Route.useSearch().preview)
  const navigate = useNavigate()
  const { p, error, reload } = useMyProgramme(slug, preview)
  const search = preview ? { preview: 1 as const } : {}
  // Global Leadership's modules live on /practice, not the engine's pages.
  const builtIn = p?.source === 'built-in'
  const backTo = () => (builtIn ? void navigate({ to: '/practice' }) : void navigate({ to: '/programmes/$slug', params: { slug }, search }))

  return (
    <DarkShell
      back={builtIn ? { to: '/practice', label: p.title } : { to: '/programmes/$slug', params: { slug }, search, label: p?.title ?? 'Back' }}
      eyebrow={p ? `${p.title} · Foundation assessment` : 'Foundation assessment'}
      title="Foundation assessment"
      description="The foundations of the programme, in one test. It earns your Foundation certificate."
    >
      {preview && (
        <p className="mx-auto mb-5 flex max-w-2xl items-start gap-2.5 rounded-lg border border-gold-300/30 bg-gold-400/10 px-4 py-3 text-sm text-gold-100">
          <Eye size={16} className="mt-0.5 shrink-0" />
          <span>
            <span className="font-semibold">Preview{p?.preview ? ` of the ${p.preview.status === 'draft' ? 'draft' : 'live version'}, v${p.version}` : ''}.</span>{' '}
            Nothing is saved, and answers are checked in your browser.
          </span>
        </p>
      )}
      {error ? (
        <DarkError title="Couldn’t open this programme." message={error} />
      ) : !p ? (
        <p className="flex items-center gap-2 text-sm text-white/60">
          <Loader2 size={15} className="animate-spin" /> Loading…
        </p>
      ) : (
        <Final p={p} preview={preview} reload={reload} backTo={backTo} />
      )}
    </DarkShell>
  )
}
