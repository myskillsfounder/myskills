import { useState } from 'react'
import { ExternalLink, FolderKanban, Pencil, Trash2 } from 'lucide-react'
import { errorMessage } from '@/lib/errors'
import { newId, type Profile, type ProfilePatch, type Project } from '@/lib/profile'
import { Field, Modal, PrimaryButton, Section, Textarea } from './ui'
import { VerificationBadge } from './VerificationSection'
import type { VerificationView } from '@/lib/verification'

const EMPTY: Project = { id: '', title: '', description: '', link: '', year: '' }

/** Only http(s) links are rendered as anchors — this is free text a student
 *  typed, and a `javascript:` URL here would run on click. */
function safeLink(url?: string): string | null {
  const v = url?.trim()
  return v && /^https?:\/\//i.test(v) ? v : null
}

export function ProjectsSection({
  profile,
  save,
  verification,
}: {
  profile: Profile
  save: (patch: ProfilePatch) => Promise<Profile>
  /** Omit to hide verification badges. */
  verification?: VerificationView
}) {
  const list = profile.projects
  const [editing, setEditing] = useState<Project | null>(null)
  const [error, setError] = useState<string>()
  const isEdit = editing !== null && list.some((x) => x.id === editing.id)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    setError(undefined)
    const next = isEdit
      ? list.map((x) => (x.id === editing.id ? editing : x))
      : [...list, { ...editing, id: editing.id || newId() }]
    try {
      await save({ projects: next })
      setEditing(null)
    } catch (err) {
      setError(errorMessage(err))
    }
  }
  async function remove(id: string) {
    setError(undefined)
    try {
      await save({ projects: list.filter((x) => x.id !== id) })
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <Section title="Projects" onAdd={() => setEditing({ ...EMPTY, id: newId() })}>
      {list.length ? (
        <ul className="space-y-5">
          {list.map((x) => {
            const href = safeLink(x.link)
            return (
              <li key={x.id} className="flex gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded bg-ink-200 text-ink-600">
                  <FolderKanban size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink-900">
                        {x.title}
                        {verification && <VerificationBadge status={verification.status('project', x)} />}
                      </p>
                      {x.year && <p className="text-xs text-ink-500">{x.year}</p>}
                      {href && (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-xs font-medium text-brand-700 hover:underline"
                        >
                          <ExternalLink size={12} className="shrink-0" />
                          <span className="truncate">{href.replace(/^https?:\/\//i, '')}</span>
                        </a>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(x)}
                        aria-label="Edit"
                        className="rounded-full p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(x.id)}
                        aria-label="Delete"
                        className="rounded-full p-1.5 text-ink-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {x.description && (
                    <p className="mt-1.5 whitespace-pre-line text-sm text-ink-600">{x.description}</p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-ink-500">
          Campaigns, case studies, websites or freelance work you’ve done — each one counts toward
          your Career Readiness Score.
        </p>
      )}

      {error && !editing && <p className="mt-3 text-sm text-red-700">{error}</p>}

      <Modal
        open={editing !== null}
        title={isEdit ? 'Edit project' : 'Add project'}
        onClose={() => {
          setEditing(null)
          setError(undefined)
        }}
      >
        {editing && (
          <form onSubmit={submit} className="space-y-4">
            <Field
              label="Project title"
              required
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Year"
                inputMode="numeric"
                value={editing.year ?? ''}
                onChange={(e) => setEditing({ ...editing, year: e.target.value })}
              />
              <Field
                label="Link (optional)"
                type="url"
                placeholder="https://"
                value={editing.link ?? ''}
                onChange={(e) => setEditing({ ...editing, link: e.target.value })}
              />
            </div>
            <Textarea
              label="What did you do?"
              rows={4}
              value={editing.description ?? ''}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            />
            {error && <p className="text-sm text-red-700">{error}</p>}
            <div className="flex justify-end">
              <PrimaryButton type="submit">Save</PrimaryButton>
            </div>
          </form>
        )}
      </Modal>
    </Section>
  )
}
