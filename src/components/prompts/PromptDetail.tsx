/**
 * Full prompt reader. Bottom sheet on phones, centred modal on desktop.
 * Copy is pinned in the footer inside the safe area — the one action people
 * actually came for stays in the thumb zone no matter how long the prompt is.
 */
import { useEffect, useState } from 'react'
import { Bookmark, Check, Copy, ExternalLink } from 'lucide-react'
import type { Prompt } from '@/lib/promptLibrary'
import { wordCount } from '@/lib/promptText'
import { PromptBody } from './PromptBody'
import { Sheet } from './Sheet'

const CHATGPT = (q: string) => `https://chatgpt.com/?q=${encodeURIComponent(q)}`
const CLAUDE = (q: string) => `https://claude.ai/new?q=${encodeURIComponent(q)}`

export function PromptDetail({
  prompt,
  trackName,
  saved,
  onToggleSave,
  onClose,
}: {
  prompt: Prompt | null
  trackName: string
  saved: boolean
  onToggleSave: () => void
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => setCopied(false), [prompt?.id])

  if (!prompt) return null

  async function copy() {
    if (!prompt) return
    try {
      await navigator.clipboard.writeText(prompt.body)
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
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                {trackName}
              </span>
              <span className="text-[11px] text-ink-400">{wordCount(prompt.body)} words</span>
            </div>
            <h2 className="mt-1.5 text-[15px] font-semibold leading-snug text-ink-900">{prompt.title}</h2>
          </div>
          <button
            type="button"
            onClick={onToggleSave}
            aria-label={saved ? 'Remove from saved' : 'Save prompt'}
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
            href={CHATGPT(prompt.body)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open in ChatGPT"
            className="inline-flex h-11 items-center gap-1.5 rounded-full border border-ink-200 px-3.5 text-xs font-medium text-ink-600"
          >
            GPT <ExternalLink size={12} />
          </a>
          <a
            href={CLAUDE(prompt.body)}
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
      <PromptBody body={prompt.body} />
      <p className="mt-6 rounded-xl bg-ink-50 p-3.5 text-xs leading-relaxed text-ink-500">
        Paste this into any AI assistant. Answer its questions as you go — the prompt is written to
        run as a back-and-forth, not a one-shot request.
      </p>
    </Sheet>
  )
}
