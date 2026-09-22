import type { ReactNode } from 'react'

/** A section label styled like a system readout — monospace, bracketed —
 *  instead of the tracked-caps sans used elsewhere on the site. Shared
 *  across the AI-forward pages (home, Career Readiness) so their type
 *  reads as one voice. */
export function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <p
      className={`font-mono text-[11px] font-bold uppercase tracking-[0.12em] ${
        dark ? 'text-brand-200' : 'text-brand-700'
      }`}
    >
      <span aria-hidden className={dark ? 'text-white/30' : 'text-ink-300'}>
        [{' '}
      </span>
      {children}
      <span aria-hidden className={dark ? 'text-white/30' : 'text-ink-300'}>
        {' '}]
      </span>
    </p>
  )
}
