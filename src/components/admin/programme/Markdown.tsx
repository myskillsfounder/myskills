import type { ReactNode } from 'react'

/**
 * Just enough Markdown for the agents' reports and research: headings,
 * paragraphs, bullet lists, quotes, bold, italics, code and links. Built as
 * React elements (never as HTML), so nothing in a report can run as code.
 */
export function Markdown({ text }: { text: string }) {
  // A heading is always a block of its own, even with no blank line after it.
  const blocks = text
    .replace(/\r\n/g, '\n')
    .replace(/^(#{1,4}\s.*)$/gm, '\n$1\n')
    .split(/\n{2,}/)
  return <div className="space-y-3 text-sm leading-relaxed text-ink-800">{blocks.map((b, i) => block(b.trim(), i))}</div>
}

function block(b: string, key: number) {
  if (!b) return null
  const h = /^(#{1,4})\s+(.*)$/.exec(b)
  if (h && !b.includes('\n')) {
    const cls = ['font-display text-xl font-semibold text-ink-900', 'pt-2 font-display text-lg font-semibold text-ink-900', 'pt-1 text-base font-semibold text-ink-900', 'font-semibold text-ink-900'][h[1].length - 1]
    return (
      <p key={key} className={cls}>
        {inline(h[2])}
      </p>
    )
  }
  const lines = b.split('\n')
  if (lines.every((l) => /^>\s?/.test(l))) {
    return (
      <blockquote key={key} className="rounded-lg border-l-4 border-amber-300 bg-amber-50 px-3 py-2 text-ink-800">
        {inline(lines.map((l) => l.replace(/^>\s?/, '')).join(' '))}
      </blockquote>
    )
  }
  // A paragraph may run straight into a list ("Still open:\n- …").
  const first = lines.findIndex((l) => /^\s*([-*]|\d+\.)\s+/.test(l))
  if (first >= 0 && lines.slice(first).every((l) => /^\s*([-*]|\d+\.)\s+/.test(l) || /^\s{2,}\S/.test(l))) {
    const items: string[] = []
    for (const l of lines.slice(first)) {
      if (/^\s*([-*]|\d+\.)\s+/.test(l)) items.push(l.replace(/^\s*([-*]|\d+\.)\s+/, ''))
      else items[items.length - 1] += ` ${l.trim()}`
    }
    const ordered = /^\s*\d+\./.test(lines[first])
    const List = ordered ? 'ol' : 'ul'
    return (
      <div key={key}>
        {first > 0 && <p className="mb-1">{inline(lines.slice(0, first).join(' '))}</p>}
        <List className={`space-y-1 pl-5 ${ordered ? 'list-decimal' : 'list-disc'}`}>
          {items.map((it, i) => (
            <li key={i}>{inline(it)}</li>
          ))}
        </List>
      </div>
    )
  }
  return <p key={key}>{inline(lines.join(' '))}</p>
}

const TOKEN = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g

function inline(s: string): ReactNode[] {
  return s.split(TOKEN).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={i} className="rounded bg-ink-100 px-1 py-0.5 text-[12px]">
          {part.slice(1, -1)}
        </code>
      )
    }
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part)
    if (link) {
      return /^https?:\/\//.test(link[2]) ? (
        <a key={i} href={link[2]} target="_blank" rel="noreferrer noopener" className="font-medium text-brand-700 underline underline-offset-2">
          {link[1]}
        </a>
      ) : (
        link[1]
      )
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>
    return part
  })
}
