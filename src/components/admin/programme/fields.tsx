import { createContext, useContext, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'

/**
 * True for Global Leadership and Digital Marketing: their modules, tasks,
 * questions, statements and skills can't be added, removed or reordered
 * (progress and scores count them), only reworded.
 */
export const StructureLock = createContext(false)
export const useStructureLock = () => useContext(StructureLock)

/** A labelled one-line text box. */
export function Text({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: string
}) {
  return (
    <label className="block text-sm font-medium text-ink-800">
      {label}
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="field mt-1" />
      {hint && <span className="mt-1 block text-xs font-normal text-ink-500">{hint}</span>}
    </label>
  )
}

/** A labelled text area. */
export function Area({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  rows?: number
  placeholder?: string
}) {
  return (
    <label className="block text-sm font-medium text-ink-800">
      {label}
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} className="field mt-1" />
    </label>
  )
}

export function NumberField({ label, value, onChange, min = 0 }: { label: string; value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <label className="block text-sm font-medium text-ink-800">
      {label}
      <input
        type="number"
        min={min}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="field mt-1"
      />
    </label>
  )
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  labels,
}: {
  label: string
  value: T
  options: readonly T[]
  onChange: (v: T) => void
  labels?: Partial<Record<T, string>>
}) {
  return (
    <label className="block text-sm font-medium text-ink-800">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value as T)} className="field mt-1">
        {options.map((o) => (
          <option key={o} value={o}>
            {labels?.[o] ?? o.charAt(0).toUpperCase() + o.slice(1)}
          </option>
        ))}
      </select>
    </label>
  )
}

/** Small icon buttons to move or remove an item in a list. */
export function ItemTools({
  index,
  count,
  onMove,
  onRemove,
  removeLabel = 'Remove',
}: {
  index: number
  count: number
  onMove: (to: number) => void
  onRemove: () => void
  removeLabel?: string
}) {
  const btn = 'rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-800 disabled:opacity-30'
  return (
    <span className="flex shrink-0 items-center gap-0.5">
      <button type="button" className={btn} disabled={index === 0} onClick={() => onMove(index - 1)} aria-label="Move up">
        <ArrowUp size={14} />
      </button>
      <button type="button" className={btn} disabled={index === count - 1} onClick={() => onMove(index + 1)} aria-label="Move down">
        <ArrowDown size={14} />
      </button>
      <button type="button" className={`${btn} hover:text-red-700`} onClick={onRemove} aria-label={removeLabel}>
        <Trash2 size={14} />
      </button>
    </span>
  )
}

export function AddButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-ink-300 px-3 py-2 text-sm font-medium text-ink-700 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-800"
    >
      <Plus size={14} /> {children}
    </button>
  )
}

/** Returns a copy of the list with one item moved. */
export function moved<T>(list: T[], from: number, to: number): T[] {
  const next = [...list]
  const [x] = next.splice(from, 1)
  next.splice(to, 0, x)
  return next
}

/** Returns a copy of the list with one item replaced. */
export function replaced<T>(list: T[], i: number, item: T): T[] {
  return list.map((x, j) => (j === i ? item : x))
}

/** A list of plain strings: outcomes, deliverables. */
export function StringList({
  label,
  items,
  onChange,
  placeholder,
  addLabel,
}: {
  label: string
  items: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  addLabel: string
}) {
  return (
    <div>
      <p className="text-sm font-medium text-ink-800">{label}</p>
      <ul className="mt-1.5 space-y-2">
        {items.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            <input value={s} onChange={(e) => onChange(replaced(items, i, e.target.value))} placeholder={placeholder} className="field" />
            <ItemTools index={i} count={items.length} onMove={(to) => onChange(moved(items, i, to))} onRemove={() => onChange(items.filter((_, j) => j !== i))} />
          </li>
        ))}
      </ul>
      <div className="mt-2">
        <AddButton onClick={() => onChange([...items, ''])}>{addLabel}</AddButton>
      </div>
    </div>
  )
}
