/**
 * Scannable list row. Deliberately does NOT expand inline — long prompts read
 * badly inside a list on a phone, so tapping opens the reader sheet instead.
 * Only the two actions people repeat (copy, save) live on the card itself.
 */
import { useState } from 'react'
import { Bookmark, Check, Copy } from 'lucide-react'
import type { Prompt } from '@/lib/promptLibrary'
import { wordCount } from '@/lib/promptText'

export function PromptCard({
  prompt,
  trackName,
  saved,
  onToggleSave,
  onOpen,
}: {
  prompt: Prompt
  trackName: string
  saved: boolean
  onToggleSave: () => void
  onOpen: () => void
}) {
  const [copied, setCopied] = useState(false)

  async function copy(e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(prompt.body)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <article
      onClick={onOpen}
      className="cursor-pointer rounded-2xl border border-ink-100 bg-white p-4 transition-colors active:bg-ink-50 sm:hover:border-ink-200"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
            {trackName}
          </span>
          <span className="text-[11px] text-ink-400">{wordCount(prompt.body)} words</span>
        </div>

        {/* 44px tap target */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleSave()
          }}
          aria-label={saved ? 'Remove from saved' : 'Save prompt'}
          aria-pressed={saved}
          className={`-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${
            saved ? 'text-amber-500' : 'text-ink-300 hover:text-ink-500'
          }`}
        >
          <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <h3 className="mt-1.5 text-[15px] font-semibold leading-snug text-ink-900">{prompt.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-500">{prompt.body}</p>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={copy}
          className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-colors ${
            copied ? 'bg-emerald-600 text-white' : 'bg-ink-900 text-white active:bg-ink-800'
          }`}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
        <span className="text-xs font-medium text-brand-600">Read prompt →</span>
      </div>
    </article>
  )
}
