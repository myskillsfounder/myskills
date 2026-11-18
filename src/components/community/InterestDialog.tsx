import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Briefcase, Check, FileText, Lock, Trash2, Upload, X } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { useProfile } from '@/lib/useProfile'
import {
  CV_ACCEPT,
  NOTE_MAX,
  applyWithCv,
  checkCv,
  withdrawInterest,
  type InterestStatus,
  type MyInterest,
} from '@/lib/internshipInterest'
import type { InternshipTrack } from './Marketplace'
import { ApplicationStrength } from './ApplicationStrength'

/**
 * Apply to a kind of internship with a CV: choose a PDF or Word file, add a short
 * note, send. When they have already applied it shows where that stands, and lets
 * them replace the CV or withdraw. See lib/internshipInterest.ts for what happens
 * to the CV and to the application.
 */

export const INTEREST_LABEL: Record<InterestStatus, string> = {
  new: 'Received',
  contacted: 'We’ve been in touch',
  shared: 'Shared with a company',
  closed: 'Closed',
}

const size = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`)

export function InterestDialog({ track, existing, onClose }: { track: InternshipTrack; existing?: MyInterest; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(!existing)
  const [file, setFile] = useState<File | null>(null)
  const [note, setNote] = useState(existing?.note ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [confirmWithdraw, setConfirmWithdraw] = useState(false)
  // The profile that goes with the application, and how strong it is.
  const { profile, loading: profileLoading, save, upload } = useProfile()
  const strength = (compact: boolean) =>
    profile ? <ApplicationStrength profile={profile} save={save} upload={upload} suggestedSkills={track.skills} compact={compact} /> : null

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [onClose])

  function choose(f: File | undefined) {
    if (!f) return
    const problem = checkCv(f)
    setError(problem ?? '')
    setFile(problem ? null : f)
  }

  async function send() {
    const problem = checkCv(file)
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    setError('')
    try {
      await applyWithCv({ trackSlug: track.slug, trackTitle: track.title, file: file as File, note, existing })
      setSent(true)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  async function withdraw() {
    if (!existing) return
    setBusy(true)
    setError('')
    try {
      await withdrawInterest(existing)
      onClose()
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={`Apply: ${track.title}`}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink-900/50" />
      <div className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-e2 sm:max-w-lg sm:rounded-3xl">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-900"
        >
          <X size={18} />
        </button>

        <div className="overflow-y-auto p-6 sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-e1">
            <Briefcase size={22} />
          </span>
          <p className="mt-4 pr-10 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Internship</p>
          <h2 className="mt-1 pr-10 font-display text-2xl font-semibold leading-tight text-ink-900">{track.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">{track.body}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {track.skills.map((s) => (
              <span key={s} className="rounded-full bg-ink-900/[0.04] px-2.5 py-1 text-[11px] font-medium text-ink-700">
                {s}
              </span>
            ))}
          </div>

          {sent ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white">
                <Check size={24} strokeWidth={3} />
              </span>
              <p className="mt-3 font-display text-lg font-semibold text-ink-900">Application sent</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-700">
                We have your CV. When a partner company opens this kind of internship, we’ll share your application with them and let you know.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="press mt-4 h-10 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-emerald-700"
              >
                Done
              </button>
              {strength(true)}
            </div>
          ) : existing && !editing ? (
            <div className="mt-6 rounded-2xl bg-ink-900/[0.03] p-4">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <Check size={13} strokeWidth={3} /> {INTEREST_LABEL[existing.status]}
              </p>
              <p className="mt-3 flex items-center gap-2 text-sm text-ink-800">
                <FileText size={16} className="shrink-0 text-ink-500" /> <span className="min-w-0 truncate">{existing.cv_name}</span>
              </p>
              {existing.note && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-600">{existing.note}</p>}
              <p className="mt-3 text-xs text-ink-500">
                When a partner company opens this kind of internship, we share your application with them and let you know.
              </p>
              {strength(true)}
              {error && (
                <p role="alert" className="mt-3 text-sm text-red-600">
                  {error}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="press h-10 rounded-xl border border-ink-300 px-4 text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-100"
                >
                  Replace My CV
                </button>
                {confirmWithdraw ? (
                  <span className="inline-flex items-center gap-2 text-sm">
                    <span className="text-ink-700">Withdraw and delete your CV?</span>
                    <button type="button" disabled={busy} onClick={() => void withdraw()} className="font-semibold text-red-600 hover:underline disabled:opacity-50">
                      {busy ? 'Withdrawing…' : 'Yes, withdraw'}
                    </button>
                    <button type="button" onClick={() => setConfirmWithdraw(false)} className="font-medium text-ink-600 hover:underline">
                      Keep it
                    </button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setConfirmWithdraw(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-red-600">
                    <Trash2 size={14} /> Withdraw
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div>
              {profileLoading ? <div className="mt-6 h-24 animate-pulse rounded-2xl bg-ink-900/[0.04]" aria-hidden /> : strength(false)}
              <p className="mt-6 text-sm font-semibold text-ink-900">Your CV</p>
              <input
                ref={fileRef}
                type="file"
                accept={CV_ACCEPT}
                className="sr-only"
                aria-label="Choose your CV"
                onChange={(e) => choose(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  choose(e.dataTransfer.files?.[0])
                }}
                className={`mt-2 flex w-full flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
                  file ? 'border-emerald-300 bg-emerald-50' : 'border-ink-300 hover:border-brand-300 hover:bg-brand-50/50'
                }`}
              >
                {file ? (
                  <>
                    <FileText size={22} className="text-emerald-700" />
                    <span className="max-w-full truncate text-sm font-semibold text-ink-900">{file.name}</span>
                    <span className="text-xs text-ink-600">{size(file.size)} · tap to choose a different file</span>
                  </>
                ) : (
                  <>
                    <Upload size={22} className="text-ink-500" />
                    <span className="text-sm font-semibold text-ink-900">{existing ? 'Choose your new CV' : 'Choose your CV'}</span>
                    <span className="text-xs text-ink-500">PDF or Word, up to 5 MB</span>
                  </>
                )}
              </button>

              <label htmlFor="interest-note" className="mt-5 block text-sm font-semibold text-ink-900">
                A short note <span className="font-normal text-ink-500">(optional)</span>
              </label>
              <textarea
                id="interest-note"
                rows={3}
                value={note}
                maxLength={NOTE_MAX}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Why this internship, and what you have done that fits."
                className="mt-1.5 w-full resize-y rounded-xl border border-ink-200 bg-white p-3 text-sm leading-relaxed text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
              <p className="mt-1 text-right text-xs text-ink-500">
                {note.length}/{NOTE_MAX}
              </p>

              <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-ink-500">
                <Lock size={13} className="mt-0.5 shrink-0" />
                Your CV and profile are kept privately. Only the MySkills team can open them, and we share them with a partner company only for this kind of internship. You can withdraw any time.
              </p>

              {error && (
                <p role="alert" className="mt-3 text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void send()}
                  className="press h-11 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-e1 transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? 'Sending…' : existing ? 'Update Application' : 'Send Application'}
                </button>
                {existing && (
                  <button type="button" onClick={() => setEditing(false)} className="text-sm font-medium text-ink-600 hover:text-ink-900">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
