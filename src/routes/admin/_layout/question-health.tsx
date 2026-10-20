import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Activity, Check, ChevronDown, Search } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { decisionLabQuestions } from '@/lib/decisionLabs'
import {
  FLAG,
  MIN_ANSWERS,
  fetchQuestionHealth,
  flagsFor,
  type QuestionFlag,
  type QuestionStats,
} from '@/lib/questionHealth'
import { RequireSection } from '@/components/admin/AdminSectionGate'
import { ExportButton } from '@/components/admin/ExportButton'
import { Alert, Badge, Chip, PageHeader, Skeleton } from '@/components/ui'

// The same section as editing the Foundation questions.
export const Route = createFileRoute('/admin/_layout/question-health')({
  component: () => (
    <RequireSection section="assessment">
      <QuestionHealthPage />
    </RequireSection>
  ),
})

const label = (slug: string) =>
  slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
const LETTER = ['A', 'B', 'C', 'D']
// The practice questions' text lives in the question bank in the app, not the database.
const PRACTICE = new Map(decisionLabQuestions.map((q) => [q.id, q]))

type Row = QuestionStats & { flags: QuestionFlag[]; text: string; opts: string[] }
type View = 'all' | 'flagged' | 'enough' | QuestionFlag

function Stat({ value, label: l, tone = 'text-ink-900' }: { value: string | number; label: string; tone?: string }) {
  return (
    <div className="card p-4">
      <p className={`font-display text-2xl font-semibold tabular-nums ${tone}`}>{value}</p>
      <p className="mt-0.5 text-sm text-ink-600">{l}</p>
    </div>
  )
}

function QuestionRow({ q }: { q: Row }) {
  const [open, setOpen] = useState(false)
  const total = q.option_counts.reduce((a, b) => a + b, 0)
  const enough = q.answered >= MIN_ANSWERS
  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-4 px-4 py-3.5 text-left transition-colors hover:bg-ink-50 sm:px-5"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink-900">{q.title || q.text}</span>
          <span className="mt-0.5 block text-xs text-ink-500">
            {q.question_id} · {q.bank === 'practice' ? label(q.grp) : `Foundation · ${q.grp}`}
            {q.topic && q.bank === 'practice' ? ` · ${q.topic}` : ''}
            {q.difficulty ? ` · ${q.difficulty}` : ''}
          </span>
          {q.flags.length > 0 && (
            <span className="mt-1.5 flex flex-wrap gap-1">
              {q.flags.map((f) => (
                <Badge key={f} tone={FLAG[f].tone}>
                  {FLAG[f].label}
                </Badge>
              ))}
            </span>
          )}
        </span>
        <span className="w-24 shrink-0 text-right">
          <span className="block font-display text-lg font-semibold tabular-nums text-ink-900">
            {q.correct_pct === null ? '—' : `${Math.round(q.correct_pct)}%`}
          </span>
          <span className="block text-[11px] text-ink-500">right</span>
        </span>
        <span className="hidden w-24 shrink-0 text-right sm:block">
          <span className={`block font-display text-lg font-semibold tabular-nums ${q.separation !== null && q.separation < 0 ? 'text-red-700' : 'text-ink-900'}`}>
            {q.separation === null ? '—' : `${q.separation > 0 ? '+' : ''}${Math.round(q.separation)}`}
          </span>
          <span className="block text-[11px] text-ink-500">separation</span>
        </span>
        <span className="w-20 shrink-0 text-right">
          <span className={`block font-display text-lg font-semibold tabular-nums ${enough ? 'text-ink-900' : 'text-ink-400'}`}>
            {q.answered}
          </span>
          <span className="block text-[11px] text-ink-500">students</span>
        </span>
        <ChevronDown size={16} className={`mt-1.5 shrink-0 text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-ink-900/[0.06] bg-ink-50/60 px-4 py-4 sm:px-5">
          {q.title && q.text && <p className="text-sm text-ink-800">{q.text}</p>}
          <ul className="space-y-2">
            {q.opts.map((o, i) => {
              const n = q.option_counts[i] ?? 0
              const share = total > 0 ? n / total : 0
              const right = i === q.correct_index
              return (
                <li key={i}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className={`min-w-0 ${right ? 'font-semibold text-emerald-800' : 'text-ink-700'}`}>
                      {LETTER[i]}. {o} {right && <Check size={13} className="inline text-emerald-600" />}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-ink-500">
                      {n} · {Math.round(share * 100)}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100">
                    <div className={`h-full rounded-full ${right ? 'bg-emerald-500' : 'bg-ink-300'}`} style={{ width: `${share * 100}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="text-xs text-ink-500">
            {enough
              ? `${q.answered} students answered it${q.bank === 'practice' ? ` for the first time (${q.answers} answers in all, with retakes)` : ''}. Separation compares the top ${q.upper_n} with the bottom ${q.lower_n} on this test.`
              : `Only ${q.answered} of the ${MIN_ANSWERS} first answers needed before these numbers mean much.`}
          </p>
          {q.flags.map((f) => (
            <p key={f} className="rounded-lg bg-white p-3 text-sm text-ink-700">
              <span className="font-semibold text-ink-900">{FLAG[f].label}:</span> {FLAG[f].means}
            </p>
          ))}
        </div>
      )}
    </li>
  )
}

/**
 * How every practice and Foundation question performs, with the standard
 * checks flagged: what the Assessment Agent will work from, and useful to the
 * team on its own.
 */
function QuestionHealthPage() {
  const [rows, setRows] = useState<QuestionStats[] | null | undefined>(undefined)
  const [error, setError] = useState<string>()
  const [bank, setBank] = useState<'practice' | 'foundation'>('practice')
  const [grp, setGrp] = useState('')
  const [view, setView] = useState<View>('all')
  const [q, setQ] = useState('')

  useEffect(() => {
    fetchQuestionHealth().then(setRows, (e) => setError(errorMessage(e)))
  }, [])

  const all: Row[] = useMemo(
    () =>
      (rows ?? []).map((r) => {
        const p = r.bank === 'practice' ? PRACTICE.get(r.question_id) : undefined
        return {
          ...r,
          flags: flagsFor(r),
          text: p ? p.question : (r.question ?? ''),
          opts: p ? p.options : (r.options ?? []),
        }
      }),
    [rows],
  )
  const inBank = all.filter((r) => r.bank === bank)
  const groups = [...new Set(inBank.map((r) => r.grp))].sort()
  const term = q.trim().toLowerCase()
  const shown = inBank
    .filter((r) => !grp || r.grp === grp)
    .filter((r) =>
      view === 'all' ? true : view === 'flagged' ? r.flags.length > 0 : view === 'enough' ? r.answered >= MIN_ANSWERS : r.flags.includes(view),
    )
    .filter((r) => !term || [r.question_id, r.title ?? '', r.text, r.topic ?? ''].some((v) => v.toLowerCase().includes(term)))
    // Worst first: the most serious flags, then the most-answered.
    .sort((a, b) => {
      const rank = (r: Row) =>
        r.flags.includes('reversed') ? 0 : r.flags.includes('check-key') ? 1 : r.flags.length > 0 ? 2 : 3
      return rank(a) - rank(b) || b.answered - a.answered || a.question_id.localeCompare(b.question_id)
    })

  const enough = inBank.filter((r) => r.answered >= MIN_ANSWERS).length
  const flagged = inBank.filter((r) => r.flags.length > 0).length
  const kept = inBank.reduce((n, r) => n + r.answers, 0)
  const viewCounts = (v: View) =>
    inBank.filter((r) =>
      v === 'all' ? true : v === 'flagged' ? r.flags.length > 0 : v === 'enough' ? r.answered >= MIN_ANSWERS : r.flags.includes(v),
    ).length

  return (
    <>
      <PageHeader
        eyebrow="Programmes"
        title="Question health"
        subtitle="How every practice and Foundation question performs: how many get it right, which options get picked, and whether it tells strong students from weak ones."
        actions={
          rows ? (
            <ExportButton<Row>
              name={`question-health-${bank}`}
              rows={shown}
              columns={[
                { header: 'Question', value: (r) => r.question_id },
                { header: bank === 'practice' ? 'Track' : 'Category', value: (r) => r.grp },
                { header: 'Topic', value: (r) => r.topic },
                { header: 'Difficulty', value: (r) => r.difficulty },
                { header: 'Title', value: (r) => r.title ?? r.text },
                { header: 'Students (first time)', value: (r) => r.answered },
                { header: 'All answers', value: (r) => r.answers },
                { header: '% right', value: (r) => r.correct_pct },
                { header: 'Separation', value: (r) => r.separation },
                { header: 'Picked A', value: (r) => r.option_counts[0] },
                { header: 'Picked B', value: (r) => r.option_counts[1] },
                { header: 'Picked C', value: (r) => r.option_counts[2] },
                { header: 'Picked D', value: (r) => r.option_counts[3] },
                { header: 'Correct option', value: (r) => (r.correct_index === null ? '' : LETTER[r.correct_index]) },
                { header: 'Flags', value: (r) => r.flags.map((f) => FLAG[f].label).join('; ') },
              ]}
            />
          ) : undefined
        }
      />

      {error && (
        <Alert tone="danger" title="Couldn’t load question health">
          <p>{error}</p>
        </Alert>
      )}
      {rows === null && (
        <Alert tone="info" title="Question health isn’t set up yet">
          <p>Run docs/supabase-question-health.sql in Supabase (after docs/supabase-learner-events.sql).</p>
        </Alert>
      )}
      {rows === undefined && !error && <Skeleton className="h-64 w-full" />}

      {rows && (
        <>
          <div className="mb-5 inline-flex rounded-xl border border-ink-200 bg-white p-1" role="tablist" aria-label="Question bank">
            {(['practice', 'foundation'] as const).map((b) => (
              <button
                key={b}
                type="button"
                role="tab"
                aria-selected={bank === b}
                onClick={() => {
                  setBank(b)
                  setGrp('')
                  setView('all')
                }}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${bank === b ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100'}`}
              >
                {b === 'practice' ? 'Practice (Digital Marketing)' : 'Foundation assessment'}
              </button>
            ))}
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat value={inBank.length} label="Questions" />
            <Stat value={kept.toLocaleString('en-IN')} label="Answers kept" />
            <Stat value={`${enough} of ${inBank.length}`} label={`With ${MIN_ANSWERS}+ students, enough to judge`} />
            <Stat value={flagged} label="Flagged" tone={flagged > 0 ? 'text-amber-700' : 'text-ink-900'} />
          </div>

          {enough === 0 && (
            <div className="mb-5 flex items-start gap-3 rounded-xl bg-brand-50 p-4 text-sm text-ink-700">
              <Activity size={18} className="mt-0.5 shrink-0 text-brand-700" />
              <p>
                Answers have been kept since 21 Oct 2026. A question needs {MIN_ANSWERS} students answering it for the first time
                before its numbers mean much, so flags appear as students practise. Until then the numbers are shown, without
                flags.
              </p>
            </div>
          )}

          <div className="mb-3 flex flex-wrap items-center gap-2">
            {(['all', 'flagged', 'enough', 'reversed', 'check-key', 'no-separation', 'too-hard', 'too-easy', 'unused-option'] as View[])
              .filter((v) => v === 'all' || v === 'enough' || viewCounts(v) > 0)
              .map((v) => (
                <Chip key={v} active={view === v} onClick={() => setView(v)}>
                  {v === 'all' ? 'All' : v === 'flagged' ? 'Flagged' : v === 'enough' ? 'Enough answers' : FLAG[v].label} ·{' '}
                  {viewCounts(v)}
                </Chip>
              ))}
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative w-full max-w-sm">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Question, title or topic"
                aria-label="Search questions"
                className="field h-10"
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
            <select
              value={grp}
              onChange={(e) => setGrp(e.target.value)}
              className="field h-10 py-0"
              style={{ width: 'auto' }}
              aria-label={bank === 'practice' ? 'Track' : 'Category'}
            >
              <option value="">{bank === 'practice' ? 'Every track' : 'Every category'}</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {bank === 'practice' ? label(g) : g}
                </option>
              ))}
            </select>
          </div>

          {shown.length === 0 ? (
            <p className="text-sm text-ink-500">No question matches.</p>
          ) : (
            <ul className="card divide-y divide-ink-900/[0.06] overflow-hidden">
              {shown.map((r) => (
                <QuestionRow key={`${r.bank}-${r.question_id}`} q={r} />
              ))}
            </ul>
          )}
        </>
      )}
    </>
  )
}
