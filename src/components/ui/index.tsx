import { useId, useState } from 'react'
import type { ComponentType, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { Link } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'

type IconType = ComponentType<{ size?: number; className?: string }>

/* ========================================================================== */
/* BUTTONS                                                                    */
/* ========================================================================== */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark'
type Size = 'sm' | 'md' | 'lg'

const VARIANT: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white shadow-e1 hover:bg-brand-700 active:bg-brand-800',
  secondary: 'border border-ink-300 bg-white text-ink-800 hover:border-ink-400 hover:bg-ink-50',
  ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  dark: 'bg-ink-900 text-white hover:bg-ink-800',
}

const SIZE: Record<Size, string> = {
  sm: 'h-9 gap-1.5 rounded-lg px-3.5 text-[13px]',
  md: 'h-11 gap-2 rounded-xl px-5 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-6 text-[15px]',
}

const BTN =
  'press inline-flex shrink-0 items-center justify-center font-semibold transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50'

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  full,
  className = '',
  children,
  ...rest
}: {
  variant?: Variant
  size?: Size
  icon?: IconType
  iconRight?: IconType
  full?: boolean
  className?: string
  children?: ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const s = size === 'sm' ? 14 : 16
  return (
    <button
      className={`${BTN} ${VARIANT[variant]} ${SIZE[size]} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {Icon && <Icon size={s} />}
      {children}
      {IconRight && <IconRight size={s} />}
    </button>
  )
}

export function ButtonLink({
  to,
  href,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  full,
  className = '',
  children,
}: {
  to?: string
  href?: string
  variant?: Variant
  size?: Size
  icon?: IconType
  iconRight?: IconType
  full?: boolean
  className?: string
  children?: ReactNode
}) {
  const s = size === 'sm' ? 14 : 16
  const cls = `${BTN} ${VARIANT[variant]} ${SIZE[size]} ${full ? 'w-full' : ''} ${className}`
  const inner = (
    <>
      {Icon && <Icon size={s} />}
      {children}
      {IconRight && <IconRight size={s} />}
    </>
  )
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {inner}
      </a>
    )
  }
  return (
    <Link to={to ?? '/'} className={cls}>
      {inner}
    </Link>
  )
}

/** Square icon-only button. Always pass `label` — it becomes the aria-label. */
export function IconButton({
  icon: Icon,
  label,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...rest
}: {
  icon: IconType
  label: string
  variant?: Variant
  size?: Size
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const box = size === 'sm' ? 'h-9 w-9' : 'h-11 w-11'
  return (
    <button
      aria-label={label}
      title={label}
      className={`${BTN} ${VARIANT[variant]} ${box} rounded-xl ${className}`}
      {...rest}
    >
      <Icon size={size === 'sm' ? 15 : 18} />
    </button>
  )
}

/* ========================================================================== */
/* SURFACES + LAYOUT                                                          */
/* ========================================================================== */

export function Card({
  className = '',
  interactive = false,
  children,
  ...rest
}: { className?: string; interactive?: boolean; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card ${interactive ? 'lift' : ''} ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  eyebrow?: string
}) {
  return (
    <header className="rise-in mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl font-semibold leading-tight text-ink-900 sm:text-[2.5rem]">
          {title}
        </h1>
        {subtitle && <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-ink-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-ink-600">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/* ========================================================================== */
/* FORMS                                                                      */
/* ========================================================================== */

export function Field({
  label,
  hint,
  error,
  required,
  children,
  htmlFor,
}: {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
  htmlFor?: string
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink-800">
        {label}
        {!required && <span className="ml-1 font-normal text-ink-400">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-ink-500">{hint}</p>
      )}
    </div>
  )
}

export function Input({
  label,
  error,
  hint,
  required = true,
  passwordToggle,
  type = 'text',
  className = '',
  ...rest
}: {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  passwordToggle?: boolean
  className?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'id'>) {
  const id = useId()
  const [reveal, setReveal] = useState(false)
  const resolved = passwordToggle ? (reveal ? 'text' : 'password') : type

  const control = (
    <div className="relative">
      <input
        id={id}
        type={resolved}
        aria-invalid={error ? true : undefined}
        className={`field ${passwordToggle ? 'pr-11' : ''} ${className}`}
        {...rest}
      />
      {passwordToggle && (
        <button
          type="button"
          onClick={() => setReveal((v) => !v)}
          aria-label={reveal ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-500 transition-colors hover:text-ink-800"
        >
          {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </div>
  )

  if (!label) return control
  return (
    <Field label={label} error={error} hint={hint} required={required} htmlFor={id}>
      {control}
    </Field>
  )
}

export function Textarea({
  label,
  error,
  hint,
  required = true,
  className = '',
  ...rest
}: {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'>) {
  const id = useId()
  const control = (
    <textarea id={id} aria-invalid={error ? true : undefined} className={`field resize-y ${className}`} {...rest} />
  )
  if (!label) return control
  return (
    <Field label={label} error={error} hint={hint} required={required} htmlFor={id}>
      {control}
    </Field>
  )
}

/** Selectable pill — used for filters, topics, quick replies. */
export function Chip({
  active,
  icon: Icon,
  className = '',
  children,
  ...rest
}: {
  active?: boolean
  icon?: IconType
  className?: string
  children: ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`press inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors ${
        active
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-ink-300 bg-white text-ink-700 hover:border-ink-400 hover:bg-ink-50'
      } ${className}`}
      {...rest}
    >
      {Icon && <Icon size={13} />}
      {children}
    </button>
  )
}

/* ========================================================================== */
/* FEEDBACK + DATA DISPLAY                                                    */
/* ========================================================================== */

export function Badge({
  tone = 'neutral',
  icon: Icon,
  children,
}: {
  tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'gold'
  icon?: IconType
  children: ReactNode
}) {
  const tones = {
    neutral: 'border-ink-200 bg-ink-100 text-ink-700',
    brand: 'border-brand-200 bg-brand-50 text-brand-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    danger: 'border-red-200 bg-red-50 text-red-700',
    gold: 'border-gold-200 bg-gold-50 text-gold-700',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tones[tone]}`}
    >
      {Icon && <Icon size={11} />}
      {children}
    </span>
  )
}

export function Progress({
  value,
  tone = 'brand',
  size = 'md',
  label,
}: {
  value: number
  tone?: 'brand' | 'success' | 'warning' | 'neutral'
  size?: 'sm' | 'md'
  label?: string
}) {
  const tones = {
    brand: 'bg-brand-600',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    neutral: 'bg-ink-400',
  }
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`w-full overflow-hidden rounded-full bg-ink-200 ${size === 'sm' ? 'h-1.5' : 'h-2'}`}
    >
      <div
        className={`h-full rounded-full ${tones[tone]}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, transition: 'width 0.8s cubic-bezier(0.2,0.8,0.2,1)' }}
      />
    </div>
  )
}

export function Avatar({
  name,
  src,
  size = 40,
}: {
  name: string
  src?: string | null
  size?: number
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover ring-1 ring-ink-200"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials || '?'}
    </span>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: IconType
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-500">
        <Icon size={24} />
      </span>
      <p className="mt-4 font-display text-lg font-semibold text-ink-900">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-600">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />
}

export function Alert({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'success' | 'warning' | 'danger'
  title?: string
  children?: ReactNode
}) {
  const tones = {
    info: 'border-brand-200 bg-brand-50 text-brand-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    danger: 'border-red-200 bg-red-50 text-red-900',
  }
  return (
    <div role={tone === 'danger' ? 'alert' : undefined} className={`rounded-xl border p-4 text-sm ${tones[tone]}`}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? 'mt-1 opacity-90' : 'opacity-90'}>{children}</div>}
    </div>
  )
}

/** Back-compat: older screens import ErrorNote. */
export function ErrorNote({ title, message, hint }: { title: string; message?: string; hint?: ReactNode }) {
  return (
    <Alert tone="danger" title={title}>
      {message && <p>{message}</p>}
      {hint && <p className="mt-1">{hint}</p>}
    </Alert>
  )
}

export function Stat({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string
  value: ReactNode
  sub?: string
  icon?: IconType
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-ink-500">
        {Icon && <Icon size={12} />}
        {label}
      </p>
      <p className="mt-0.5 font-display text-lg font-semibold text-ink-900">{value}</p>
      {sub && <p className="text-[11px] text-ink-500">{sub}</p>}
    </div>
  )
}
