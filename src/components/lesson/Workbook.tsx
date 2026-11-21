import { useCallback, useState } from 'react'
import { Check, ClipboardCheck, Copy, Eye, ShieldCheck, Sparkles } from 'lucide-react'
import type { ModuleWorkbook, WorkbookCheck } from '@/lib/programmeEngine'
import type { CheckQuestion } from '@/content/dmTopics'
import { CheckIn } from '@/components/practice/CheckIn'

/**
 * A course-engine module's interactive workbook chapter (ModuleWorkbook), shown
 * as steps inside the lesson before the Learn cards: the big idea, key terms,
 * "Try it with AI" and a check-in. The same look as Digital Marketing's topic
 * pages. None of it is graded: which steps are done is kept on this device.
 */

/* ---------------------------------------------------------------- progress */

export interface WorkbookLocal {
  idea: boolean
  terms: string[]
  tried: number[]
  checkDone: boolean
  checkFirstTry: number
}

const EMPTY: WorkbookLocal = { idea: false, terms: [], tried: [], checkDone: false, checkFirstTry: 0 }
const keyFor = (slug: string, module: string) => `myskills.workbook.${slug}.${module}`

function load(key: string): WorkbookLocal {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<WorkbookLocal>) } : EMPTY
  } catch {
    return EMPTY
  }
}

/** This device's progress through one module's workbook. */
export function useWorkbookProgress(slug: string, module: string) {
  const key = keyFor(slug, module)
  const [local, setLocal] = useState<WorkbookLocal>(() => load(key))
  const update = useCallback(
    (patch: Partial<WorkbookLocal>) =>
      setLocal((l) => {
      const next = { ...l, ...patch }
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch {
        // Private mode or storage full: progress just isn't remembered.
      }
      return next
    }),
    [key],
  )
  return { local, update }
}

/** Which workbook steps a module has, in order. */
export function workbookSteps(w: ModuleWorkbook | undefined) {
  if (!w) return []
  return [
    { key: 'idea', label: 'Big idea', kind: 'idea' as const },
    ...(w.terms.length ? [{ key: 'terms', label: 'Key terms', kind: 'terms' as const }] : []),
    ...(w.try_it?.length ? [{ key: 'try', label: 'Try it', kind: 'try' as const }] : []),
    ...(w.checks?.length ? [{ key: 'check', label: 'Check-in', kind: 'check' as const }] : []),
  ]
}

export function workbookStepDone(key: string, w: ModuleWorkbook, local: WorkbookLocal): boolean {
  if (key === 'idea') return local.idea
  if (key === 'terms') return w.terms.every((t) => local.terms.includes(t.term))
  if (key === 'try') return (w.try_it ?? []).every((_, i) => local.tried.includes(i))
  if (key === 'check') return local.checkDone
  return false
}

/* -------------------------------------------------------------------- idea */

export function WorkbookIdea({ w }: { w: ModuleWorkbook }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">The big idea</p>
      <h2 className="mt-1 font-display text-xl font-semibold leading-snug text-ink-900 sm:text-2xl">{w.hook}</h2>
      <div className="mt-4 space-y-4">
        {w.idea.map((p, i) => (
          <p key={p.slice(0, 24) + i} className={`leading-8 ${i === 0 ? 'text-[18px] text-ink-900' : 'text-[16px] text-ink-700'}`}>
            {p}
          </p>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-800">Why it matters</p>
          <ul className="mt-3 space-y-2.5">
            {w.why.map((x, i) => (
              <li key={x} className="flex items-start gap-2.5 text-sm leading-snug text-ink-800">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-semibold text-white">{i + 1}</span>
                {x}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-sky-800">
            <Sparkles size={14} /> In everyday words
          </p>
          <p className="mt-3 text-sm italic leading-relaxed text-ink-800">{w.simple}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-red-700">Myth</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-900">{w.myth.wrong}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Fact</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-900">{w.myth.right}</p>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------- terms */

function TermCard({ term, meaning, learned, onLearn }: { term: string; meaning: string; learned: boolean; onLearn: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <li
      className={`flex flex-col rounded-2xl border p-4 transition-all duration-300 ${
        learned ? 'border-emerald-200 bg-emerald-50' : open ? 'border-teal-300 bg-teal-50 shadow-e1' : 'border-ink-200 bg-white hover:-translate-y-0.5 hover:border-teal-300'
      }`}
    >
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="text-left">
        <span className="flex items-start justify-between gap-2">
          <span className="font-display text-base font-semibold leading-snug text-ink-900">{term}</span>
          {learned ? (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white" aria-label="Learned">
              <Check size={14} strokeWidth={3} />
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal-700">{open ? 'Meaning' : 'Tap'}</span>
          )}
        </span>
        <span className={`mt-2 block text-sm leading-relaxed ${open || learned ? 'text-ink-800' : 'text-ink-500'}`}>{open || learned ? meaning : 'Tap to see the meaning'}</span>
      </button>
      {open && !learned && (
        <button
          type="button"
          onClick={onLearn}
          className="press mt-3 self-start rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-e1 transition-colors hover:bg-teal-700"
        >
          I know this
        </button>
      )}
    </li>
  )
}

export function WorkbookTerms({ w, learned, onLearn }: { w: ModuleWorkbook; learned: string[]; onLearn: (term: string) => void }) {
  const count = w.terms.filter((t) => learned.includes(t.term)).length
  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-ink-900 sm:text-2xl">Words to know first</h2>
      <p className="mt-1 text-sm text-ink-600">
        Tap a card to see the meaning, then choose “I know this”. {count} of {w.terms.length} learned.
      </p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-200">
        <div className="h-full rounded-full bg-teal-600 transition-[width] duration-500" style={{ width: `${(count / w.terms.length) * 100}%` }} />
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {w.terms.map((t) => (
          <TermCard key={t.term} term={t.term} meaning={t.meaning} learned={learned.includes(t.term)} onLearn={() => onLearn(t.term)} />
        ))}
      </ul>
    </div>
  )
}

/* --------------------------------------------------------------------- try */

function TryCard({ item, n, tried, onTried }: { item: NonNullable<ModuleWorkbook['try_it']>[number]; n: number; tried: boolean; onTried: () => void }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(item.prompt)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // No clipboard access: the prompt is on screen to select by hand.
    }
  }
  return (
    <article className={`rounded-2xl border p-4 sm:p-5 ${tried ? 'border-emerald-200 bg-emerald-50/60' : 'border-ink-200 bg-white'}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Try it {n}</p>
      <h3 className="mt-1 font-display text-lg font-semibold text-ink-900">{item.title}</h3>

      <div className="mt-3 rounded-xl border border-ink-200 bg-ink-50 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-ink-600">1. Copy this into any AI assistant</p>
          <button
            type="button"
            onClick={() => void copy()}
            className="press inline-flex h-8 items-center gap-1.5 rounded-lg border border-ink-300 px-2.5 text-xs font-semibold text-ink-800 transition-colors hover:bg-ink-100"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className="mt-2 whitespace-pre-line font-mono text-[13px] leading-relaxed text-ink-900">{item.prompt}</p>
      </div>

      <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-ink-800">
        <Eye size={15} className="mt-0.5 shrink-0 text-sky-600" />
        <span>
          <span className="font-semibold">2. Look for: </span>
          {item.look_for}
        </span>
      </p>
      <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-ink-800">
        <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-600" />
        <span>
          <span className="font-semibold">3. Check it: </span>
          {item.check}
        </span>
      </p>

      <button
        type="button"
        onClick={onTried}
        disabled={tried}
        className="press mt-4 inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-emerald-700 disabled:opacity-60"
      >
        <ClipboardCheck size={15} /> {tried ? 'Tried it' : 'I tried it'}
      </button>
    </article>
  )
}

export function WorkbookTry({ w, tried, onTried }: { w: ModuleWorkbook; tried: number[]; onTried: (i: number) => void }) {
  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-ink-900 sm:text-2xl">Try it with AI</h2>
      <p className="mt-1 text-sm text-ink-600">
        Use any free AI assistant on your phone or computer. Keep your personal details out of it, and check what it gives you.
      </p>
      <div className="mt-4 space-y-4">
        {(w.try_it ?? []).map((item, i) => (
          <TryCard key={item.title + i} item={item} n={i + 1} tried={tried.includes(i)} onTried={() => onTried(i)} />
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------- check */

const asCheckQuestion = (c: WorkbookCheck): CheckQuestion => ({
  id: c.id,
  scenario: c.scenario,
  question: c.question,
  options: [c.options[0], c.options[1], c.options[2], c.options[3]],
  answer: c.correct_index,
  hint: c.hint,
  why: c.why,
})

export function WorkbookChecks({
  w,
  done,
  firstTry,
  onFinish,
}: {
  w: ModuleWorkbook
  done: boolean
  firstTry: number
  onFinish: (firstTry: number) => void
}) {
  const checks = (w.checks ?? []).filter((c) => c.options.length === 4)
  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-ink-900 sm:text-2xl">Do you have it? {checks.length} quick questions</h2>
      <p className="mt-1 text-sm text-ink-600">Pick an answer and lock it. You’ll see why right away. Any you miss come back. This isn’t marked.</p>
      <CheckIn questions={checks.map(asCheckQuestion)} done={done} firstTry={firstTry} onFinish={onFinish} />
    </div>
  )
}
