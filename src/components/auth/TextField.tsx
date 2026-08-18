import type { InputHTMLAttributes } from 'react'
import { Input } from '@/components/ui'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> {
  label: string
  error?: string
  /** Adds a show/hide toggle and manages the input type. */
  passwordToggle?: boolean
}

/**
 * Thin wrapper kept so the auth screens don't all need touching — the real
 * control is the design-system `Input`, so every field in the product looks
 * and behaves the same.
 */
export function TextField({ label, error, passwordToggle, ...rest }: TextFieldProps) {
  return <Input label={label} error={error} passwordToggle={passwordToggle} required {...rest} />
}
