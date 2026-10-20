/**
 * Spreadsheet exports for the admin panel: what a list shows, as a .csv file
 * that opens straight in Excel or Google Sheets.
 *
 * - Every cell is quoted, so commas, quotes and line breaks in names, messages
 *   and notes stay in their cell.
 * - Text that starts with = + - @ (or a tab or return) gets a leading '. A
 *   spreadsheet would otherwise run it as a formula, and the text comes from
 *   students and partners ("CSV injection"). Phone numbers are left alone.
 * - The file starts with a byte-order mark so Excel reads it as UTF-8 and
 *   names in Malayalam, Hindi or with ₹ come through intact.
 */
export type CsvValue = string | number | boolean | null | undefined
export interface CsvColumn<T> {
  header: string
  value: (row: T) => CsvValue
}

function cell(v: CsvValue): string {
  if (v === null || v === undefined) return '""'
  if (typeof v === 'boolean') return v ? '"Yes"' : '"No"'
  let s = typeof v === 'number' ? String(v) : v
  // A phone number or a plain number ("+91 98470 00000", "-5") can't be a
  // formula worth fearing, so it is left as it is.
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s) && !/^[+-]?[\d\s().-]+$/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const lines = [columns.map((c) => cell(c.header)).join(',')]
  for (const r of rows) lines.push(columns.map((c) => cell(c.value(r))).join(','))
  return lines.join('\r\n')
}

const pad = (n: number) => String(n).padStart(2, '0')

/** 2026-10-20: sorts correctly as text, and every spreadsheet reads it as a date. */
export function csvDate(iso: string | null | undefined): string {
  if (!iso) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 2026-10-20 14:05, local time. */
export function csvDateTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : `${csvDate(iso)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Saves the rows as myskills-<name>-<today>.csv. */
export function downloadCsv<T>(name: string, rows: T[], columns: CsvColumn<T>[]): void {
  const blob = new Blob(['﻿', toCsv(rows, columns)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `myskills-${name}-${csvDate(new Date().toISOString())}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
