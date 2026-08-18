/**
 * Renders a prompt as real paragraphs and bullet lists. Dumping the raw text
 * with `whitespace-pre-line` is faithful but hard to scan on a phone.
 */
import { parsePromptBody } from '@/lib/promptText'

export function PromptBody({ body }: { body: string }) {
  const blocks = parsePromptBody(body)
  return (
    <div className="space-y-3.5">
      {blocks.map((b, i) =>
        b.type === 'p' ? (
          <p key={i} className="text-[15px] leading-relaxed text-ink-800">
            {b.text}
          </p>
        ) : (
          <ul key={i} className="space-y-2">
            {b.items.map((item, j) => (
              <li key={j} className="flex gap-3 text-[15px] leading-relaxed text-ink-800">
                <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  )
}
