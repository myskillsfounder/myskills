import { useId } from 'react'
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { Pencil, Plus, X } from 'lucide-react'

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ink-200 px-5 py-4">
          <h3 className="font-display text-lg font-semibold text-ink-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
          >
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
}

export function Field({ label, ...props }: FieldProps) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink-800">
        {label}
      </label>
      <input
        id={id}
        className="mt-1.5 w-full rounded-lg border border-ink-300 bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
        {...props}
      />
    </div>
  )
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string
  placeholder?: string
  options: { value: string; label: string }[]
}

export function Select({ label, placeholder, options, ...props }: SelectFieldProps) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink-800">
        {label}
      </label>
      <select
        id={id}
        className="mt-1.5 w-full rounded-lg border border-ink-300 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

interface TextareaFieldProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string
}

export function Textarea({ label, ...props }: TextareaFieldProps) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink-800">
        {label}
      </label>
      <textarea
        id={id}
        className="mt-1.5 w-full rounded-lg border border-ink-300 bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
        {...props}
      />
    </div>
  )
}

export function PrimaryButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      {...props}
      className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  )
}

/** Card wrapper for a profile section, with optional add / edit icon buttons. */
export function Section({
  title,
  onAdd,
  onEdit,
  children,
}: {
  title: string
  onAdd?: () => void
  onEdit?: () => void
  children: ReactNode
}) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
        <div className="flex items-center gap-1">
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              aria-label={`Add ${title}`}
              className="rounded-full p-2 text-ink-600 hover:bg-ink-100 hover:text-ink-900"
            >
              <Plus size={20} />
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit ${title}`}
              className="rounded-full p-2 text-ink-600 hover:bg-ink-100 hover:text-ink-900"
            >
              <Pencil size={18} />
            </button>
          )}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}
