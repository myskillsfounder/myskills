import { ArrowRight, Brain, Calculator, Lock, Sparkles, Target } from 'lucide-react'
import { skillTracks } from '@/lib/skillTracks'
import type { PracticeSummary } from '@/lib/practiceResults'

export type PracticeMode = 'scenario' | 'vocabulary' | 'numerals'

interface ModeDef {
  key: PracticeMode
  title: string
  tagline: string
  description: string
  icon: typeof Target
  available: boolean
  /** tailwind classes for the card's accent */
  accent: { tile: string; chip: string; bar: string; label: string }
}

const MODES: ModeDef[] = [
  {
    key: 'scenario',
    title: 'Scenario Based',
    tagline: 'Decision Labs',
    description: 'Real business situations across 8 marketing skill tracks. Read the brief, make the call.',
    icon: Target,
    available: true,
    accent: {
      tile: 'from-brand-500 to-brand-700',
      chip: 'border-brand-200 bg-brand-50 text-brand-700',
      bar: 'from-brand-500 to-brand-700',
      label: 'text-brand-700',
    },
  },
  {
    key: 'vocabulary',
    title: 'Vocabulary Builder',
    tagline: 'Know the language',
    description: 'Master the terminology marketers actually use — from CAC to attribution windows.',
    icon: Brain,
    available: true,
    accent: {
      tile: 'from-sky-500 to-brand-600',
      chip: 'border-sky-200 bg-sky-50 text-sky-700',
      bar: 'from-sky-500 to-brand-600',
      label: 'text-sky-800',
    },
  },
  {
    key: 'numerals',
    title: 'Numerals',
    tagline: 'Marketing math',
    description: 'Budgets, ROAS, CPC and conversion math — build the number sense clients expect.',
    icon: Calculator,
    available: false,
    accent: {
      tile: 'from-emerald-500 to-emerald-700',
      chip: 'border-ink-300 bg-ink-100 text-ink-600',
      bar: 'from-emerald-500 to-emerald-700',
      label: 'text-emerald-800',
    },
  },
]

export function ModePicker({
  practice,
  vocabLearned,
  vocabTotal,
  onSelect,
}: {
  practice: PracticeSummary
  vocabLearned: number
  vocabTotal: number
  onSelect: (mode: PracticeMode) => void
}) {
  const started = skillTracks.filter((t) => practice[t.slug]).length
  const scenarioPct = Math.round((started / skillTracks.length) * 100)
  const vocabPct = vocabTotal ? Math.round((vocabLearned / vocabTotal) * 100) : 0

  const progress: Partial<Record<PracticeMode, { label: string; pct: number }>> = {
    scenario: { label: `${started} / ${skillTracks.length} tracks started`, pct: scenarioPct },
    vocabulary: { label: `${vocabLearned} / ${vocabTotal} words learned`, pct: vocabPct },
  }

  return (
    <section>
      <div className="mb-4">
        <h2 className="font-display text-xl font-semibold text-ink-900">Choose a practice mode</h2>
        <p className="mt-0.5 text-sm text-ink-600">Three ways to sharpen your skills.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {MODES.map((m, i) => {
          const Icon = m.icon
          const locked = !m.available
          return (
            <button
              key={m.key}
              type="button"
              disabled={locked}
              onClick={() => onSelect(m.key)}
              className={`rise-in group relative flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white p-5 text-left shadow-sm ${
                locked ? 'cursor-not-allowed' : 'lift'
              }`}
              style={{ animationDelay: `${i * 90}ms` }}
            >
              {locked && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-100/90 to-transparent"
                />
              )}

              <div className="relative flex items-start justify-between">
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${m.accent.tile} text-white shadow-md ring-4 ring-ink-100 transition-transform duration-500 ${
                    locked ? 'opacity-70 grayscale' : 'group-hover:rotate-6 group-hover:scale-110'
                  }`}
                >
                  <Icon size={24} />
                </span>
                {locked ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-ink-300 bg-ink-100 px-2.5 py-1 text-[11px] font-medium text-ink-600">
                    <Lock size={11} /> Locked
                  </span>
                ) : (
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${m.accent.chip}`}>
                    <Sparkles size={11} /> Available
                  </span>
                )}
              </div>

              <p className={`relative mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] ${m.accent.label}`}>
                {m.tagline}
              </p>
              <h3 className="relative mt-1 font-display text-xl font-semibold tracking-tight text-ink-900">
                {m.title}
              </h3>
              <p className="relative mt-1.5 flex-1 text-sm leading-relaxed text-ink-600">{m.description}</p>

              {m.available && progress[m.key] ? (
                <div className="relative mt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${m.accent.label}`}>{progress[m.key]!.label}</span>
                    <span className={`font-display font-semibold ${m.accent.label}`}>
                      {progress[m.key]!.pct}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink-200">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${m.accent.bar}`}
                      style={{
                        width: `${progress[m.key]!.pct}%`,
                        transition: 'width 1s cubic-bezier(0.2,0.8,0.2,1)',
                      }}
                    />
                  </div>
                  <span className={`mt-3 inline-flex items-center gap-2 text-sm font-semibold ${m.accent.label}`}>
                    Start practicing
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-ink-200 bg-white transition-transform duration-300 group-hover:translate-x-1">
                      <ArrowRight size={14} />
                    </span>
                  </span>
                </div>
              ) : (
                <p className="relative mt-4 inline-flex items-center gap-1.5 text-xs text-ink-600">
                  <Lock size={12} /> We’re building this — check back soon.
                </p>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
