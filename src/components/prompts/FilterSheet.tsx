/**
 * Mobile filter sheet, shared by both library tabs. Filters live behind a
 * thumb-reachable button at the bottom of the screen rather than a pill row at
 * the top, which on a phone sits in the hardest part of the screen to reach
 * one-handed.
 */
import { Bookmark, Check } from 'lucide-react'
import { Sheet } from './Sheet'

export const ALL = 'all'

export interface FilterTrack {
  slug: string
  name: string
  /** matches the current filters; `null` renders as a disabled "Soon" row */
  count: number | null
}

export function FilterSheet({
  open,
  onClose,
  tracks,
  track,
  setTrack,
  savedOnly,
  setSavedOnly,
  totalCount,
  savedCount,
  resultCount,
  itemNoun = 'prompt',
}: {
  open: boolean
  onClose: () => void
  tracks: FilterTrack[]
  track: string
  setTrack: (slug: string) => void
  savedOnly: boolean
  setSavedOnly: (v: boolean) => void
  totalCount: number
  savedCount: number
  resultCount: number
  itemNoun?: string
}) {
  const Row = ({
    label,
    count,
    active,
    disabled,
    onClick,
  }: {
    label: string
    count: number | string
    active: boolean
    disabled?: boolean
    onClick: () => void
  }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl px-3.5 text-left text-sm transition-colors ${
        disabled
          ? 'cursor-not-allowed text-ink-400'
          : active
            ? 'bg-brand-50 font-medium text-brand-700'
            : 'text-ink-800 active:bg-ink-100'
      }`}
    >
      <span>{label}</span>
      <span className="flex items-center gap-2">
        <span className="text-xs text-ink-500">{count}</span>
        {active && <Check size={16} className="text-brand-600" />}
      </span>
    </button>
  )

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={<h2 className="text-[15px] font-semibold text-ink-900">Filter</h2>}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white active:bg-brand-700"
        >
          Show {resultCount} {resultCount === 1 ? itemNoun : `${itemNoun}s`}
        </button>
      }
    >
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => setSavedOnly(!savedOnly)}
          aria-pressed={savedOnly}
          className={`flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl px-3.5 text-left text-sm transition-colors ${
            savedOnly ? 'bg-amber-50 font-medium text-amber-800' : 'text-ink-800 active:bg-ink-100'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <Bookmark size={16} fill={savedOnly ? 'currentColor' : 'none'} />
            Saved only
          </span>
          <span className="text-xs text-ink-500">{savedCount}</span>
        </button>

        <div className="my-2 border-t border-ink-200" />
        <p className="px-3.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-500">Track</p>

        <Row
          label="All tracks"
          count={savedOnly ? savedCount : totalCount}
          active={track === ALL}
          onClick={() => setTrack(ALL)}
        />
        {tracks.map((t) => (
          <Row
            key={t.slug}
            label={t.name}
            count={t.count === null ? 'Soon' : t.count}
            active={track === t.slug}
            disabled={t.count === null}
            onClick={() => setTrack(t.slug)}
          />
        ))}
      </div>
    </Sheet>
  )
}
