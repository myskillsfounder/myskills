import { useEffect, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, Clock } from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { gradeLocally, moduleDone, submitFinal, type MyProgramme } from '@/lib/programmeStudent'
import { PageHeader } from '@/components/app/PageHeader'
import { ProgrammeFrame, QuizRunner, previewSearch, useMyProgramme } from '@/components/programme/shared'
import { Alert, Button } from '@/components/ui'

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
  const allDone = p.content.modules.every((m) => moduleDone(p, m))
  const search = preview ? { preview: 1 as const } : {}

  if (p.final?.passed && !taken) {
    return (
      <Alert tone="success" title={`Passed with ${p.final.percent}%`}>
        <p>
          The final assessment is done.{' '}
          <Link to="/programmes/$slug" params={{ slug }} className="font-semibold underline">
            Back to {p.title}
          </Link>
        </p>
      </Alert>
    )
  }
  if (!allDone && !preview) {
    return (
      <Alert tone="info" title="Finish every module first">
        <p>The final assessment opens once each module’s tasks, reflection and quiz are done.</p>
      </Alert>
    )
  }
  if (p.final && !preview && !taken && new Date(p.final.next_at) > new Date()) {
    return (
      <Alert tone="warning" title={`Last try: ${p.final.percent}%`}>
        <p>
          {f.pass_percent}% passes. You can take it again on{' '}
          {new Date(p.final.next_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}. Use the time to revisit the
          modules you found hardest.
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
            {f.questions.length} questions across every skill, {f.minutes} minutes.
          </li>
          <li>{f.pass_percent}% passes. If you don’t pass, you can try again after 7 days.</li>
          <li>Once you start, the timer runs. When it ends, answer anything left and submit straight away.</li>
        </ul>
        <Button className="mt-4" iconRight={ArrowRight} onClick={() => setStarted(true)}>
          Start the final assessment
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
        passPercent={f.pass_percent}
        submitLabel="Submit the final assessment"
        onSubmit={async (answers) => {
          if (preview) return gradeLocally(f.questions, answers)
          const r = await submitFinal(slug, answers)
          setTaken(true)
          void reload()
          return r
        }}
        onDone={() => void navigate({ to: '/programmes/$slug', params: { slug }, search })}
        doneLabel={`Back to ${p.title}`}
      />
    </>
  )
}

/** The final assessment: one test across every skill, timed. */
function FinalPage() {
  const { slug } = Route.useParams()
  const preview = Boolean(Route.useSearch().preview)
  const { p, error, reload } = useMyProgramme(slug, preview)
  return (
    <ProgrammeFrame slug={slug} preview={preview} back="programme" p={p} error={error}>
      {(p) => (
        <div className="space-y-4">
          <PageHeader eyebrow={`${p.title} · Final assessment`} title="Final assessment" description={`Everything the programme covers, in one test.`} />
          <Final p={p} preview={preview} reload={reload} />
        </div>
      )}
    </ProgrammeFrame>
  )
}
