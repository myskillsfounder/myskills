/**
 * Vocabulary term reader. Shows the ready-to-paste teaching prompt with the
 * term substituted in, so the user never has to edit a placeholder by hand.
 * Same sheet chrome as the deep-dive reader — bottom sheet on phones, centred
 * modal on desktop, copy pinned in the safe area.
 */
import { useEffect, useState } from 'react'
import { Bookmark, Check, Copy, ExternalLink } from 'lucide-react'
import { promptForTerm, type VocabTerm } from '@/lib/vocabLibrary'
import { PromptBody } from './PromptBody'
import { Sheet } from './Sheet'

const CHATGPT = (q: string) => `https://chatgpt.com/?q=${encodeURIComponent(q)}`
const CLAUDE = (q: string) => `https://claude.ai/new?q=${encodeURIComponent(q)}`

export function VocabDetail({
  term,
  trackName,
  saved,
  onToggleSave,
  onClose,
}: {
  term: VocabTerm | null
  trackName: string
  saved: boolean
  onToggleSave: () => void
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => setCopied(false), [term?.id])

  if (!term) return null

  const prompt = promptForTerm(term.term)

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={
        <div className="flex items-start gap-2.5">
          <div className="min-w-0">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
              {trackName}
            </span>
            <h2 className="mt-1.5 text-[17px] font-semibold leading-snug text-ink-900">{term.term}</h2>
          </div>
          <button
            type="button"
            onClick={onToggleSave}
            aria-label={saved ? 'Remove from saved' : 'Save term'}
            aria-pressed={saved}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
              saved ? 'text-amber-500' : 'text-ink-300 hover:text-ink-500'
            }`}
          >
            <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>
      }
      footer={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copy}
            className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full text-sm font-semibold text-white transition-colors ${
              copied ? 'bg-emerald-600' : 'bg-brand-600 active:bg-brand-700'
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied to clipboard' : 'Copy prompt'}
          </button>
          <a
            href={CHATGPT(prompt)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open in ChatGPT"
            className="inline-flex h-11 items-center gap-1.5 rounded-full border border-ink-200 px-3.5 text-xs font-medium text-ink-600"
          >
            GPT <ExternalLink size={12} />
          </a>
          <a
            href={CLAUDE(prompt)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open in Claude"
            className="inline-flex h-11 items-center gap-1.5 rounded-full border border-ink-200 px-3.5 text-xs font-medium text-ink-600"
          >
            Claude <ExternalLink size={12} />
          </a>
        </div>
      }
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">
        Your prompt — ready to paste
      </p>
      <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-4">
        <PromptBody body={prompt} />
      </div>
      <p className="mt-5 rounded-xl bg-slate-50 p-3.5 text-xs leading-relaxed text-ink-500">
        The term is already filled in. You'll get a definition, why it matters, a real example, a
        one-line takeaway and five related concepts to learn next.
      </p>
    </Sheet>
  )
}
