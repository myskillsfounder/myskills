import { Award } from 'lucide-react'

/** Compact achievement badge for high scorers (gold). */
export function DistinctionBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
      <Award size={13} />
      Top Performer
    </span>
  )
}
