import { ArrowRight } from 'lucide-react'
import type { StudyProgramme } from '@/lib/studyAbroad'
import { Flag } from './Cards'

/*
 * Real photographs for Study abroad (Paul, 4 Nov 2026: "dont use a cartoon
 * image, use a real image"). All are free under the Unsplash License, which
 * allows this use without attribution; the credits are kept here.
 *   Nursing: a young Indian woman in a white coat with a stethoscope,
 *     by Fotos — unsplash.com/photos/H9lg5Noj660
 *   Tirana: the Clock Tower and Et'hem Bey Mosque on Skanderbeg Square,
 *     by Mario Beqollari — unsplash.com/photos/egqGPwY3wLk
 */
const unsplash = (id: string, w: number) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`

const NURSING = 'photo-1659353888906-adb3e0041693'
const CITY: Record<string, string> = {
  al: 'photo-1632353913765-9b56b7b4bd55',
}

/** The photo for a programme's subject, when there is one. */
export function programmePhoto(p: Pick<StudyProgramme, 'field' | 'title'>, w = 900): string | null {
  return /nurs/i.test(`${p.field ?? ''} ${p.title}`) ? unsplash(NURSING, w) : null
}

/** A photo of where a partner university is, by its country, when there is one. */
export function cityPhoto(code: string | null | undefined, w = 1200): string | null {
  return code && CITY[code] ? unsplash(CITY[code], w) : null
}

/**
 * A programme's photo with the journey on it: India to the destination.
 * Draws nothing when the subject has no photo.
 */
export function ProgrammePhoto({
  p,
  className = '',
  position = 'center 22%',
}: {
  p: Pick<StudyProgramme, 'field' | 'title' | 'country_code'>
  className?: string
  position?: string
}) {
  const src = programmePhoto(p)
  if (!src) return null
  return (
    <div className={`relative overflow-hidden bg-ink-200 ${className}`}>
      <img src={src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: position }} />
      <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-ink-800 shadow-sm">
        <Flag code="in" className="h-3.5 w-5" />
        <ArrowRight size={11} className="text-ink-500" />
        {p.country_code ? <Flag code={p.country_code} className="h-3.5 w-5" /> : <span>Abroad</span>}
      </span>
    </div>
  )
}
