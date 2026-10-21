import { useEffect, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, Award, Clock } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { TIERS } from '@/lib/certificates'
import { gradeLocally, submitFinal, type MyProgramme } from '@/lib/programmeStudent'
import { PageHeader } from '@/components/app/PageHeader'
import { ProgrammeFrame, QuizRunner, previewSearch, useMyProgramme } from '@/components/programme/shared'
import { Alert, Button, buttonClass } from '@/components/ui'

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
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold tabular-nums ${left < 120 ? 'bg-red-50 text-red-700' : 'bg-ink-100 text-ink-700'}`}>
      <Clock size={14} /> {mm}:{ss}
    </span>
  )
}

function Final({ p, preview, reload }: { p: MyProgramme; preview: boolean; reload: () => Promise<void> }) {
  const { slug } = Route.useParams()
  const navigate = useNavigate()
  const [started, setStarted] = useState(false)
  const [timeUp, setTimeUp] = useState(false)
  // Just submitted: keep the result and the review on screen.
  const [taken, setTaken] = useState(false)
  const f = p.content.final
  const search = preview ? { preview: 1 as const } : {}
  // Global Leadership's modules live on /practice, not the engine's pages.
  const back = p.source === 'built-in' ? '/practice' : null

  if (f.questions.length === 0) {
    return (
      <Alert tone="info" title="No Foundation assessment yet">
        <p>This programme’s Foundation assessment isn’t ready yet. Keep going with the modules.</p>
      </Alert>
    )
  }
  if (p.final && !taken) {
    const t = TIERS[p.final.kind]
    return (
      <div className={`rounded-2xl border p-5 ${t.ui.border} ${t.ui.bg}`}>
        <p className={`inline-flex items-center gap-1.5 text-sm font-semibold ${t.ui.text}`}>
          <Award size={15} /> {t.certLabel}
        </p>
        <p className="mt-2 text-sm text-ink-700">
          You took the Foundation assessment on{' '}
          {new Date(p.final.completed_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })} and scored{' '}
          {p.final.percent}%. It is taken once, and it earned your Foundation certificate in {p.title}.
        </p>
        <CertificateLink slug={p.slug} />
      </div>
    )
  }
  if (!p.foundation_unlocked && !preview) {
    return (
      <Alert tone="info" title="Finish the foundation modules first">
        <p>
          The Foundation assessment opens once each foundation module is done.{' '}
          {back ? (
            <Link to={back} className="font-semibold underline">
              Back to {p.title}
            </Link>
          ) : (
            <Link to="/programmes/$slug" params={{ slug }} className="font-semibold underline">
              Back to {p.title}
            </Link>
          )}
        </p>
      </Alert>
    )
  }
  if (!started) {
    return (
      <div className="card p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">Before you start</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-700">
          <li>
            {f.questions.length} questions on the foundations of every skill, {f.minutes} minutes.
          </li>
          <li>
            You take it once. Every finished attempt earns a Foundation certificate: Gold from {TIERS.gold.min}%, Silver from{' '}
            {TIERS.silver.min}%, Bronze below that.
          </li>
          <li>Once you start, the timer runs. When it ends, answer anything left and submit straight away.</li>
        </ul>
        <Button className="mt-4" iconRight={ArrowRight} onClick={() => setStarted(true)}>
          Start the Foundation assessment
        </Button>
      </div>
    )
  }
  return (
    <>
      <div className="sticky top-20 z-10 flex justify-end">
        {!timeUp && !taken && <Countdown minutes={f.minutes} onEnd={() => setTimeUp(true)} />}
      </div>
      {timeUp && (
        <Alert tone="warning" title="Time is up">
          <p>Answer any questions left and submit now.</p>
        </Alert>
      )}
      <QuizRunner
        questions={f.questions}
        banded
        resultNote={(r) =>
          r.certificate ? (
            <CertificateLink slug={p.slug} />
          ) : (
            <p className="mt-1 text-sm text-ink-600">Preview: no certificate is issued.</p>
          )
        }
        submitLabel="Submit the Foundation assessment"
        onSubmit={async (answers) => {
          if (preview) return gradeLocally(f.questions, answers)
          const r = await submitFinal(slug, answers)
          setTaken(true)
          void reload()
          return r
        }}
        onDone={() => (back ? void navigate({ to: back }) : void navigate({ to: '/programmes/$slug', params: { slug }, search }))}
        doneLabel={`Back to ${p.title}`}
      />
    </>
  )
}

function CertificateLink({ slug }: { slug: string }) {
  return (
    <Link to="/certificate" search={{ programme: slug }} className={`mt-3 ${buttonClass('primary', 'sm')}`}>
      See your certificate <ArrowRight size={15} />
    </Link>
  )
}

/** The Foundation assessment: one timed test on the foundations of every skill. */
function FinalPage() {
  const { slug } = Route.useParams()
  const preview = Boolean(Route.useSearch().preview)
  const { p, error, reload } = useMyProgramme(slug, preview)
  return (
    <ProgrammeFrame slug={slug} preview={preview} back="programme" p={p} error={error}>
      {(p) => (
        <div className="space-y-4">
          <PageHeader
            eyebrow={`${p.title} · Foundation assessment`}
            title="Foundation assessment"
            description="The foundations of the programme, in one test. It earns your Foundation certificate."
          />
          <Final p={p} preview={preview} reload={reload} />
        </div>
      )}
    </ProgrammeFrame>
  )
}
