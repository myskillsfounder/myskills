import { useState } from 'react'
import { Compass, Sprout } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { PATH_LABEL, setProgrammePath, type EntryPath } from '@/lib/foundationPath'

/**
 * "Where are you starting from?": a beginner learns first, someone
 * experienced takes the Foundation assessment straight away. Can be changed
 * until the first attempt.
 */
export function PathChooser({ slug, current, onChosen, dark = true }: { slug: string; current: EntryPath | null; onChosen: () => void; dark?: boolean }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  async function choose(path: EntryPath) {
    setBusy(true)
    setError(undefined)
    try {
      await setProgrammePath(slug, path)
      onChosen()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const card = (path: EntryPath, Icon: typeof Sprout) => {
    const chosen = current === path
    return (
      <button
        key={path}
        type="button"
        disabled={busy}
        onClick={() => void choose(path)}
        aria-pressed={chosen}
        className={`flex flex-1 items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
          dark
            ? chosen
              ? 'border-brand-300 bg-brand-500/20'
              : 'border-white/15 bg-white/[0.04] hover:bg-white/[0.08]'
            : chosen
              ? 'border-brand-400 bg-brand-50'
              : 'border-ink-200 bg-white hover:bg-ink-50'
        }`}
      >
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${dark ? 'bg-white/10 text-brand-200' : 'bg-brand-100 text-brand-700'}`}>
          <Icon size={19} />
        </span>
        <span>
          <span className={`block font-semibold ${dark ? 'text-white' : 'text-ink-900'}`}>{PATH_LABEL[path].title}</span>
          <span className={`mt-0.5 block text-sm leading-relaxed ${dark ? 'text-white/65' : 'text-ink-600'}`}>{PATH_LABEL[path].body}</span>
        </span>
      </button>
    )
  }

  return (
    <div>
      <p className={`font-display text-lg font-semibold ${dark ? 'text-white' : 'text-ink-900'}`}>Where are you starting from?</p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        {card('beginner', Sprout)}
        {card('experienced', Compass)}
      </div>
      <p className={`mt-2 text-xs ${dark ? 'text-white/45' : 'text-ink-500'}`}>You can change this until you take the Foundation assessment.</p>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  )
}
