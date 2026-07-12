import { useState } from 'react'
import { Briefcase, Pencil, Trash2 } from 'lucide-react'
import { newId, type Experience, type Profile, type ProfilePatch } from '@/lib/profile'
import { Field, Modal, PrimaryButton, Section, Textarea } from './ui'

function fmtMonth(v?: string): string {
  if (!v) return ''
  const [y, m] = v.split('-')
  if (!y) return ''
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return m ? `${months[Number(m) - 1] ?? ''} ${y}` : y
}
function fmtRange(x: Experience): string {
  const start = fmtMonth(x.startDate)
  const end = x.current ? 'Present' : fmtMonth(x.endDate)
  return [start, end].filter(Boolean).join(' – ')
}

const EMPTY: Experience = {
  id: '',
  title: '',
  company: '',
  employmentType: '',
  location: '',
  startDate: '',
  endDate: '',
  current: false,
  description: '',
}

export function ExperienceSection({
  profile,
  save,
}: {
  profile: Profile
  save: (patch: ProfilePatch) => Promise<Profile>
}) {
  const list = profile.experience
  const [editing, setEditing] = useState<Experience | null>(null)

  const isEdit = editing !== null && list.some((x) => x.id === editing.id)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    const next = isEdit
      ? list.map((x) => (x.id === editing.id ? editing : x))
      : [...list, { ...editing, id: editing.id || newId() }]
    await save({ experience: next })
    setEditing(null)
  }
  async function remove(id: string) {
    await save({ experience: list.filter((x) => x.id !== id) })
  }

  return (
    <Section title="Experience" onAdd={() => setEditing({ ...EMPTY, id: newId() })}>
      {list.length ? (
        <ul className="space-y-5">
          {list.map((x) => (
            <li key={x.id} className="flex gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded bg-ink-100 text-ink-500">
                <Briefcase size={18} />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{x.title}</p>
                    <p className="text-sm text-ink-700">
                      {x.company}
                      {x.employmentType ? ` · ${x.employmentType}` : ''}
                    </p>
                    <p className="text-xs text-ink-400">{fmtRange(x)}</p>
                    {x.location && <p className="text-xs text-ink-400">{x.location}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(x)}
                      aria-label="Edit"
                      className="rounded-full p-1.5 text-ink-400 hover:bg-ink-50 hover:text-ink-900"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(x.id)}
                      aria-label="Delete"
                      className="rounded-full p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {x.description && (
                  <p className="mt-1.5 whitespace-pre-line text-sm text-ink-600">
                    {x.description}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-400">Add your work or internship experience.</p>
      )}

      <Modal
        open={editing !== null}
        title={isEdit ? 'Edit experience' : 'Add experience'}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <form onSubmit={submit} className="space-y-4">
            <Field
              label="Title"
              required
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            />
            <Field
              label="Company"
              required
              value={editing.company}
              onChange={(e) => setEditing({ ...editing, company: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Employment type"
                placeholder="Full-time, Internship…"
                value={editing.employmentType ?? ''}
                onChange={(e) => setEditing({ ...editing, employmentType: e.target.value })}
              />
              <Field
                label="Location"
                value={editing.location ?? ''}
                onChange={(e) => setEditing({ ...editing, location: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Start"
                type="month"
                value={editing.startDate ?? ''}
                onChange={(e) => setEditing({ ...editing, startDate: e.target.value })}
              />
              <Field
                label="End"
                type="month"
                value={editing.endDate ?? ''}
                disabled={editing.current}
                onChange={(e) => setEditing({ ...editing, endDate: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                checked={!!editing.current}
                onChange={(e) => setEditing({ ...editing, current: e.target.checked })}
              />
              I currently work here
            </label>
            <Textarea
              label="Description"
              rows={4}
              value={editing.description ?? ''}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            />
            <div className="flex justify-end">
              <PrimaryButton type="submit">Save</PrimaryButton>
            </div>
          </form>
        )}
      </Modal>
    </Section>
  )
}
