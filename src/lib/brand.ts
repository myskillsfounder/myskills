/*
 * The public site's shared pieces of style (Paul, 11 Nov 2026: "consistent
 * branding and experience"), so the home page, Learning, Internships and the
 * rest use the same heading accent, page label and buttons. The colours behind
 * them come from lib/siteTheme.ts.
 */

/** The violet accent on a heading's last words, as on the home page. */
export const gradientText = 'bg-gradient-to-r from-[#b3a6ff] via-[#8f7bff] to-[#f0abfc] bg-clip-text text-transparent'

/** The small label above a page's heading, with its live dot. */
export const pageLabel =
  'inline-flex items-center gap-2 rounded-full border border-[#8f6bff]/35 bg-[#1b2470]/40 px-3.5 py-1.5 text-[12.5px] font-semibold text-[#d8c9ff] backdrop-blur'

/** A page's heading, under its label. */
export const pageTitle = 'mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl'

/** The main button: violet, as Study Online on the home page. */
export const buttonPrimary =
  'press inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7b6cf6] to-[#4f46e5] px-5 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(99,102,241,0.9)] transition-opacity hover:opacity-90'

/** The white button, for the one action on a card or panel. */
export const buttonWhite =
  'press inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-ink-900 transition-colors hover:bg-brand-50'

/** The outline button, for the second action. */
export const buttonOutline =
  'press inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/25 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10'
