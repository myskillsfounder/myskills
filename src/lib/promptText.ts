/**
 * Text helpers for the prompt library. Kept out of the component file so the
 * renderer module only exports components (fast-refresh friendly).
 *
 * The source prompts are plain text: blank lines separate paragraphs and "•"
 * marks bullets.
 */

export type PromptBlock = { type: 'p'; text: string } | { type: 'ul'; items: string[] }

export function parsePromptBody(body: string): PromptBlock[] {
  const blocks: PromptBlock[] = []
  let bullets: string[] = []

  const flush = () => {
    if (bullets.length) {
      blocks.push({ type: 'ul', items: bullets })
      bullets = []
    }
  }

  for (const raw of body.split('\n')) {
    const line = raw.trim()
    if (!line) {
      flush()
      continue
    }
    if (line.startsWith('•')) {
      bullets.push(line.replace(/^•\s*/, ''))
    } else {
      flush()
      blocks.push({ type: 'p', text: line })
    }
  }
  flush()
  return blocks
}

/** Roughly how long the prompt is, so people know what they're pasting. */
export function wordCount(s: string) {
  return s.trim().split(/\s+/).length
}
