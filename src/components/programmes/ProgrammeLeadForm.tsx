import { useState } from 'react'
import { Check } from 'lucide-react'
import { trackLead } from '@/lib/analytics'
import { submitProgrammeLead, type LeadProgramme } from '@/lib/programmes'

/**
 * "Tell me when it opens" for a programme that isn't open yet: name, phone,
 * and email if they like (docs/supabase-programme-leads.sql). On a dark
 * surface: the phone's front door and the AI guide.
 */
export function ProgrammeLeadForm({
  programme,
  title,
  start,
  defaultName = '',
  onSent,
}: {
  programme: LeadProgramme
  title: string
  /** Where the lead came from, for analytics: 'mobile', 'guide'. */
  start: string
  defaultName?: string
  onSent?: () => void
}) {
  const [name, setName] = useState(defaultName)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'saving' | 'done'>('idle')
  const [error, setError] = useState<string>()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (name.trim().length < 2) return setError('Please add your name.')
    if (phone.replace(/\D/g, '').length < 10) return setError('Please add a phone number we can call.')
    setState('saving')
    setError(undefined)
    try {
      await submitProgrammeLead(programme, { full_name: name, phone, email })
      trackLead('programme_waitlist', { programme, start })
      setState('done')
      onSent?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send that. Please try again.')
      setState('idle')
    }
  }

  if (state === 'done') {
    return (
      <p className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-400/15 p-3 text-sm text-emerald-100">
        <Check size={16} className="mt-0.5 shrink-0" />
        Thanks, {name.trim().split(' ')[0]}. We’ll call you as soon as {title} opens.
      </p>
    )
  }

  const field =
    'h-12 w-full rounded-xl border border-white/15 bg-white/10 px-3.5 text-base text-white placeholder:text-white/45 focus:border-white/40 focus:outline-none'
  return (
    <form onSubmit={submit} className="mt-3 space-y-2.5" noValidate>
      <p className="text-sm text-white/70">{title} opens soon. Leave your details and we’ll call you first.</p>
      <input className={field} placeholder="Your name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className={field} placeholder="Phone number" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <input className={field} placeholder="Email (optional)" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      {error && <p className="text-sm text-rose-200">{error}</p>}
      <button
        type="submit"
        disabled={state === 'saving'}
        className="press flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-[15px] font-semibold text-ink-900 disabled:opacity-60"
      >
        {state === 'saving' ? 'Sending…' : 'Tell me when it opens'}
      </button>
    </form>
  )
}
