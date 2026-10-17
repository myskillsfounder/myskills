import { ALL_SECTIONS, PRESETS, SECTION_GROUPS } from '@/lib/adminTeam'
import type { StaffSection } from '@/lib/staffAccess'

export const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x))

/** Tick the sections one person may open. Presets fill it in for the usual jobs. */
export function SectionPicker({
  value,
  onChange,
  presets = true,
}: {
  value: StaffSection[]
  onChange: (next: StaffSection[]) => void
  /** The "start from" shortcuts; off where a role is being written. */
  presets?: boolean
}) {
  const toggle = (id: StaffSection) => onChange(value.includes(id) ? value.filter((s) => s !== id) : [...value, id])
  return (
    <div>
      {presets && (
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">Start from</span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            title={p.hint}
            onClick={() => onChange(p.sections)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              sameSet(value, p.sections) ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-ink-300 text-ink-700 hover:bg-ink-100'
            }`}
          >
            {p.label}
          </button>
        ))}
        {value.length > 0 && (
          <button type="button" onClick={() => onChange([])} className="text-xs font-semibold text-ink-500 hover:text-ink-800 hover:underline">
            Clear
          </button>
        )}
      </div>
      )}

      <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {SECTION_GROUPS.map((g) => (
          <fieldset key={g.label}>
            <legend className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">{g.label}</legend>
            <div className="mt-1.5 space-y-1.5">
              {g.sections.map((s) => (
                <label key={s.id} className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-ink-50">
                  <input
                    type="checkbox"
                    checked={value.includes(s.id)}
                    onChange={() => toggle(s.id)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink-900">{s.label}</span>
                    <span className="block text-xs leading-snug text-ink-500">{s.opens}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-500">
        {value.length} of {ALL_SECTIONS.length} sections. Everyone with any access also gets the Dashboard and the Inbox,
        limited to what they can open.
      </p>
    </div>
  )
}
