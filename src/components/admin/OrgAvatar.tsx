/**
 * An organisation's logo, or its initials on a colour picked from its name,
 * so a long list of companies or institutions can be scanned by eye.
 */
const TONES = [
  'bg-brand-100 text-brand-800',
  'bg-gold-100 text-gold-700',
  'bg-emerald-100 text-emerald-800',
  'bg-sky-100 text-sky-800',
  'bg-rose-100 text-rose-800',
  'bg-violet-100 text-violet-800',
]

export function OrgAvatar({ name, logo, size = 'md' }: { name: string; logo?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const box = size === 'lg' ? 'h-14 w-14 text-lg rounded-2xl' : size === 'sm' ? 'h-9 w-9 text-xs rounded-xl' : 'h-11 w-11 text-sm rounded-xl'
  if (logo) {
    return <img src={logo} alt="" className={`${box} shrink-0 border border-ink-900/[0.06] bg-white object-contain p-1`} />
  }
  const words = name.trim().split(/\s+/).filter(Boolean)
  const initials = (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? '?').slice(0, 2)).toUpperCase()
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return (
    <span aria-hidden className={`${box} ${TONES[h % TONES.length]} flex shrink-0 items-center justify-center font-display font-semibold`}>
      {initials}
    </span>
  )
}
