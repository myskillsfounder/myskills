/**
 * Item reader. Shows the master prompt with this item's values already filled
 * in, and lets you switch between the library's prompt styles live.
 *
 * The style picker is here rather than on the library page on purpose: the
 * useful comparison is "which of these three framings do I want for *this*
 * topic", which means switching without losing your place.
 */
import { useEffect, useState } from 'react'
import { Bookmark, Check, Copy, ExternalLink } from 'lucide-react'
import {
  fillPrompt,
  type LibraryItem,
  type PromptLibrary,
  type PromptStyle,
} from '@/lib/promptLibraries'
import { PromptBody } from './PromptBody'
import { Sheet } from './Sheet'

const CHATGPT = (q: string) => `https://chatgpt.com/?q=${encodeURIComponent(q)}`
const CLAUDE = (q: string) => `https://claude.ai/new?q=${encodeURIComponent(q)}`

export function ItemSheet({
  library,
  item,
  trackName,
  saved,
  onToggleSave,
  onClose,
}: {
  library: PromptLibrary
  item: LibraryItem | null
  trackName: string
  saved: boolean
  onToggleSave: () => void
  onClose: () => void
}) {
  const [styleId, setStyleId] = useState(library.styles[0]?.id ?? '')
  const [copied, setCopied] = useState(false)

  // Reset per item, but keep the chosen style — people tend to settle on one.
  useEffect(() => setCopied(false), [item?.id, styleId])

  if (!item) return null

  const style: PromptStyle | undefined =
    library.styles.find((s) => s.id === styleId) ?? library.styles[0]
  const prompt = fillPrompt(library, style, item, trackName)

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
            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-600">
              {trackName}
            </span>
            <h2 className="mt-1.5 text-[16px] font-semibold leading-snug text-ink-900">{item.title}</h2>
            {item.subtitle && (
              <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{item.subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onToggleSave}
            aria-label={saved ? 'Remove from saved' : 'Save'}
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
      {/* Style picker — only when the library actually offers a choice */}
      {library.styles.length > 1 && (
      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
          Teaching style
        </p>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {library.styles.map((s) => {
            const active = s.id === style?.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStyleId(s.id)}
                aria-pressed={active}
                className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
                  active
                    ? 'border-ink-900 bg-ink-900 text-white'
                    : 'border-ink-200 bg-white text-ink-600 active:bg-ink-50'
                }`}
              >
                {s.name}
              </button>
            )
          })}
        </div>
        {style && <p className="mt-2 text-xs leading-relaxed text-ink-500">{style.blurb}</p>}
      </div>
      )}

      <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-4">
        <PromptBody body={prompt} />
      </div>

      <p className="mt-5 rounded-xl bg-brand-50 p-3.5 text-xs leading-relaxed text-brand-800">
        Paste this into ChatGPT, Claude or Gemini. These prompts are written to run as a
        back-and-forth — answer its questions as you go rather than expecting one long reply.
      </p>
    </Sheet>
  )
}
