import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BookOpen,
  Brain,
  Copy,
  MousePointerClick,
  Sparkles,
  Type,
  Wand2,
  type LucideIcon,
} from 'lucide-react'
import { requireOnboarded } from '@/lib/guards'
import { promptLibraries, libraryCount, totalPromptItems } from '@/lib/promptLibraries'
import { skillTracks } from '@/lib/skillTracks'
import { AppShell } from '@/components/app/AppShell'

export const Route = createFileRoute('/prompt-library/')({
  beforeLoad: requireOnboarded,
  component: PromptLibraryIndex,
})

/** Icon names live in the generated data as strings; resolve them here. */
const ICONS: Record<string, LucideIcon> = { BookOpen, Type, Sparkles, Brain }

const ACCENT = {
  brand: {
    card: 'from-brand-50 via-white to-white',
    ring: 'hover:border-brand-300',
    tile: 'bg-brand-600 text-white',
    chip: 'bg-brand-50 text-brand-700',
    count: 'text-brand-700',
    glow: 'bg-brand-200',
  },
  emerald: {
    card: 'from-emerald-50 via-white to-white',
    ring: 'hover:border-emerald-300',
    tile: 'bg-emerald-600 text-white',
    chip: 'bg-emerald-50 text-emerald-700',
    count: 'text-emerald-700',
    glow: 'bg-emerald-200',
  },
  amber: {
    card: 'from-amber-50 via-white to-white',
    ring: 'hover:border-amber-300',
    tile: 'bg-amber-500 text-white',
    chip: 'bg-amber-50 text-amber-800',
    count: 'text-amber-700',
    glow: 'bg-amber-200',
  },
} as const

const STEPS = [
  { icon: MousePointerClick, title: 'Pick a topic', body: 'Browse by skill track or search for what you want to learn.' },
  { icon: Wand2, title: 'Choose a style', body: 'Each topic comes in three framings — a case, a Socratic drill, a simulation.' },
  { icon: Copy, title: 'Paste into your AI', body: 'Copy it, or open it prefilled in ChatGPT or Claude. Then answer as you go.' },
]

/** A couple of real items so the card shows what's actually inside. */
function sampleTitles(libId: string, n = 2): string[] {
  const lib = promptLibraries.find((l) => l.id === libId)
  if (!lib) return []
  return lib.tracks.flatMap((t) => t.items.slice(0, 1).map((i) => i.title)).slice(0, n)
}

function PromptLibraryIndex() {
  return (
    <AppShell wide>
      <div className="space-y-6">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl card p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-100/60 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-emerald-100/50 blur-3xl" />

          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-300 bg-white px-3 py-1 text-[11px] font-semibold text-ink-600">
              <Sparkles size={12} className="text-brand-600" />
              Works with ChatGPT, Claude &amp; Gemini
            </span>

            <h1 className="mt-4 max-w-lg text-2xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-3xl">
              Turn any AI assistant into your marketing tutor.
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-600 sm:text-base">
              {totalPromptItems} ready-made prompts, written so the AI teaches you properly — asking
              questions, using real companies, and pushing back on your answers.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {[
                `${totalPromptItems} prompts`,
                `${promptLibraries.length} libraries`,
                `${skillTracks.length} skill tracks`,
              ].map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-ink-100 px-3 py-1.5 text-xs font-medium text-ink-600"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Libraries */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-ink-900">Choose a library</h2>

          <div className="grid gap-4 lg:grid-cols-2">
            {promptLibraries.map((lib) => {
              const Icon = ICONS[lib.icon] ?? Sparkles
              const a = ACCENT[lib.accent]
              const count = libraryCount(lib)
              const samples = sampleTitles(lib.id)

              return (
                <Link
                  key={lib.id}
                  to="/prompt-library/$libraryId"
                  params={{ libraryId: lib.id }}
                  className={`group relative flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-gradient-to-br ${a.card} p-5 transition-all ${a.ring} hover:shadow-lg hover:shadow-ink-900/5`}
                >
                  <div
                    className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full ${a.glow} opacity-40 blur-2xl transition-opacity group-hover:opacity-70`}
                  />

                  <div className="relative flex items-start gap-3.5">
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${a.tile}`}>
                      <Icon size={22} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold tracking-tight text-ink-900">{lib.name}</h3>
                      <p className="text-xs font-medium text-ink-600">{lib.tagline}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`text-xl font-semibold tracking-tight ${a.count}`}>{count}</p>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-ink-500">
                        {lib.itemNoun}s
                      </p>
                    </div>
                  </div>

                  <p className="relative mt-3 text-sm leading-relaxed text-ink-600">{lib.description}</p>

                  {/* what's actually inside */}
                  {lib.kind === 'templated' && samples.length > 0 && (
                    <div className="relative mt-3.5 space-y-1.5">
                      {samples.map((s) => (
                        <p key={s} className="flex items-start gap-2 text-xs text-ink-600">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-300" />
                          <span className="truncate">{s}</span>
                        </p>
                      ))}
                    </div>
                  )}

                  {/* the styles, visible before you commit */}
                  <div className="relative mt-4 flex flex-wrap gap-1.5">
                    {(lib.styles.length
                      ? lib.styles.map((s) => ({ key: s.id, label: s.name }))
                      : lib.tracks
                          .flatMap((t) => t.items)
                          .map((i) => ({ key: i.id, label: i.title }))
                    ).map((chip) => (
                      <span
                        key={chip.key}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${a.chip}`}
                      >
                        {chip.label}
                      </span>
                    ))}
                  </div>

                  <div className="relative mt-4 flex items-center justify-between gap-3 border-t border-ink-200 pt-3.5">
                    <span className="text-xs text-ink-500">
                      {lib.tracks.length > 1
                        ? `${lib.tracks.length} skill tracks`
                        : 'Ready to paste — no setup'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold text-white">
                      Browse
                      <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* How it works — the flow wasn't obvious on arrival */}
        <section className="card p-5">
          <h2 className="font-display text-lg font-semibold text-ink-900">How it works</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-800">
                  <s.icon size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900">
                    <span className="text-ink-400">{i + 1}. </span>
                    {s.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-600">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
