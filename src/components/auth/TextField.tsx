import { useId, useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> {
  label: string
  error?: string
  /** Adds a show/hide toggle and manages the input type. */
  passwordToggle?: boolean
}

/**
 * Labeled input with error state. When `passwordToggle` is set, renders an
 * eye button that switches the field between password and text.
 */
export function TextField({
  label,
  error,
  passwordToggle,
  type = 'text',
  ...inputProps
}: TextFieldProps) {
  const id = useId()
  const [reveal, setReveal] = useState(false)
  const resolvedType = passwordToggle ? (reveal ? 'text' : 'password') : type

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink-700">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          type={resolvedType}
          aria-invalid={error ? true : undefined}
          className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${
            error
              ? 'border-red-400 focus:border-red-400'
              : 'border-ink-200 focus:border-brand-500'
          } ${passwordToggle ? 'pr-10' : ''}`}
          {...inputProps}
        />
        {passwordToggle && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-label={reveal ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-400 hover:text-ink-700"
          >
            {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  )
}
