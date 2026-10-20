import { useState } from 'react'
import { Download } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { downloadCsv, type CsvColumn } from '@/lib/csv'

/**
 * "Export CSV" for a list: downloads what the list shows, with its filters.
 * `rows` can be a function, for a list that has to fetch more than it shows
 * (All students shows 200, the export takes up to 1,000).
 */
export function ExportButton<T>({
  name,
  rows,
  columns,
  label = 'Export CSV',
}: {
  /** Part of the file name: myskills-<name>-<date>.csv */
  name: string
  rows: T[] | (() => Promise<T[]>)
  columns: CsvColumn<T>[]
  label?: string
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const count = Array.isArray(rows) ? rows.length : undefined

  async function run() {
    setBusy(true)
    setError(undefined)
    try {
      downloadCsv(name, Array.isArray(rows) ? rows : await rows(), columns)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={() => void run()}
        disabled={busy || count === 0}
        title={count === 0 ? 'Nothing to export' : undefined}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-ink-300 bg-white px-3.5 text-sm font-medium text-ink-800 transition-colors hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Download size={15} className="text-ink-500" />
        {busy ? 'Preparing…' : label}
        {count !== undefined && count > 0 && <span className="tabular-nums text-ink-400">{count}</span>}
      </button>
      {error && <span className="mt-1 text-xs text-red-700">{error}</span>}
    </span>
  )
}
