/**
 * Shared status vocabulary for a practice track. One definition so the list,
 * the filters and the stats strip can never disagree about what "Strong"
 * means.
 */

export type TrackState = 'not-started' | 'needs-work' | 'in-progress' | 'strong'

export const STRONG_MIN = 80
export const IN_PROGRESS_MIN = 55

export function trackState(started: boolean, percent: number): TrackState {
  if (!started) return 'not-started'
  if (percent >= STRONG_MIN) return 'strong'
  if (percent >= IN_PROGRESS_MIN) return 'in-progress'
  return 'needs-work'
}

export const STATE_META: Record<
  TrackState,
  { label: string; pill: string; bar: string; dot: string }
> = {
  'not-started': {
    label: 'Not started',
    pill: 'border-ink-200 bg-ink-50 text-ink-500',
    bar: 'bg-ink-300',
    dot: 'bg-ink-300',
  },
  'needs-work': {
    label: 'Needs work',
    pill: 'border-amber-200 bg-amber-50 text-amber-700',
    bar: 'bg-amber-500',
    dot: 'bg-amber-500',
  },
  'in-progress': {
    label: 'In progress',
    pill: 'border-brand-200 bg-brand-50 text-brand-700',
    bar: 'bg-brand-500',
    dot: 'bg-brand-500',
  },
  strong: {
    label: 'Strong',
    pill: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    bar: 'bg-emerald-500',
    dot: 'bg-emerald-500',
  },
}

export function levelLabel(avg: number, practiced: number) {
  if (practiced === 0) return 'Just getting started'
  if (avg >= STRONG_MIN) return 'Advanced'
  if (avg >= 60) return 'Proficient'
  if (avg >= 40) return 'Developing'
  return 'Beginner'
}
