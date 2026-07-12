import { useState } from 'react'
import { GraduationCap, Pencil, Trash2 } from 'lucide-react'
import { newId, type Education, type Profile, type ProfilePatch } from '@/lib/profile'
import { Field, Modal, PrimaryButton, Section, Textarea } from './ui'

const EMPTY: Education = {
  id: '',
  school: '',
  degree: '',
  field: '',
  startYear: '',
  endYear: '',
  description: '',
}

export function EducationSection({
  profile,
  save,
}: {
  profile: Profile
  save: (patch: ProfilePatch) => Promise<Profile>
}) {
  const list = profile.education
  const [editing, setEditing] = useState<Education | null>(null)
  const isEdit = editing !== null && list.some((x) => x.id === editing.id)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    const next = isEdit
      ? list.map((x) => (x.id === editing.id ? editing : x))
      : [...list, { ...editing, id: editing.id || newId() }]
    await save({ education: next })
    setEditing(null)
  }
  async function remove(id: string) {
    await save({ education: list.filter((x) => x.id !== id) })
  }

  return (
    <Section title="Education" onAdd={() => setEditing({ ...EMPTY, id: newId() })}>
      {list.length ? (
        <ul className="space-y-5">
          {list.map((x) => (
            <li key={x.id} className="flex gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded bg-ink-100 text-ink-500">
                <GraduationCap size={18} />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{x.school}</p>
                    <p className="text-sm text-ink-700">
                      {[x.degree, x.field].filter(Boolean).join(', ')}
                    </p>
                    <p className="text-xs text-ink-400">
                      {[x.startYear, x.endYear].filter(Boolean).join(' – ')}
                    </p>
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
        <p className="text-sm text-ink-400">Add your school, college, or courses.</p>
      )}

      <Modal
        open={editing !== null}
        title={isEdit ? 'Edit education' : 'Add education'}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <form onSubmit={submit} className="space-y-4">
            <Field
              label="School"
              required
              value={editing.school}
              onChange={(e) => setEditing({ ...editing, school: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Degree"
                value={editing.degree ?? ''}
                onChange={(e) => setEditing({ ...editing, degree: e.target.value })}
              />
              <Field
                label="Field of study"
                value={editing.field ?? ''}
                onChange={(e) => setEditing({ ...editing, field: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Start year"
                inputMode="numeric"
                value={editing.startYear ?? ''}
                onChange={(e) => setEditing({ ...editing, startYear: e.target.value })}
              />
              <Field
                label="End year (or expected)"
                inputMode="numeric"
                value={editing.endYear ?? ''}
                onChange={(e) => setEditing({ ...editing, endYear: e.target.value })}
              />
            </div>
            <Textarea
              label="Description"
              rows={3}
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
