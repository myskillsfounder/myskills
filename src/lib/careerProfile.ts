/**
 * Turns a free-form profile into facts the Career Readiness Score can use.
 *
 * Education and experience entries predate the score, so most existing ones
 * have a free-text `degree` and `employmentType` and no structured level. The
 * inference below reads those so a student who already filled in their
 * profile isn't scored 0 until they re-edit every entry.
 */
import type { Education, EducationLevel, Experience } from './profile'

export const EDUCATION_LEVELS: { value: EducationLevel; label: string }[] = [
  { value: 'class-10', label: 'Class 10 / Secondary' },
  { value: 'class-12', label: 'Class 12 / Higher secondary' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'bachelors', label: 'Bachelor’s degree' },
  { value: 'masters', label: 'Master’s degree' },
  { value: 'doctorate', label: 'Doctorate' },
]

export const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Internship',
  'Apprenticeship',
  'Freelance',
  'Self-employed',
  'Contract',
  'Volunteer',
]

// Order matters: master's is tested before bachelor's so "B.Tech + M.Tech"
// style strings land on the higher level.
const LEVEL_PATTERNS: [EducationLevel, RegExp][] = [
  ['doctorate', /\b(ph\.?\s?d|doctorate|d\.?phil)\b/i],
  ['masters', /\b(master|mba|pgdm|pgd|m\.?\s?(tech|sc|com|a|e|s|ba|ca)\b|post\s?grad)/i],
  ['bachelors', /\b(bachelor|b\.?\s?(tech|sc|com|a|e|ba|ca|des|arch)\b|bba|bca|under\s?grad|graduat)/i],
  ['diploma', /\b(diploma|polytechnic|iti)\b/i],
  ['class-12', /\b(12(th)?|xii|hsc|higher secondary|plus two|\+2|intermediate|puc)\b/i],
  ['class-10', /\b(10(th)?|x|ssc|secondary|matric)\b/i],
]

export function educationLevelOf(e: Education): EducationLevel | null {
  if (e.level) return e.level
  const text = `${e.degree ?? ''} ${e.field ?? ''}`
  return LEVEL_PATTERNS.find(([, re]) => re.test(text))?.[0] ?? null
}

/** Finished only if an end year is given and it's already passed. A blank
 *  end year reads as in-progress — it's the safer assumption to score, and
 *  "add your graduation year" is an easy nudge. */
export function isEducationComplete(e: Education, now = new Date()): boolean {
  const end = Number.parseInt(e.endYear ?? '', 10)
  return Number.isFinite(end) && end <= now.getFullYear()
}

export function isInternship(x: Experience): boolean {
  return /intern|apprentic/i.test(`${x.employmentType ?? ''} ${x.title ?? ''}`)
}

/** Whole months between a role's start and its end (or today, if current). */
export function monthsInRole(x: Experience, now = new Date()): number {
  const parse = (v?: string) => {
    const [y, m] = (v ?? '').split('-').map(Number)
    return Number.isFinite(y) && y > 0 ? new Date(y, (m || 1) - 1, 1) : null
  }
  const start = parse(x.startDate)
  if (!start) return 0
  const end = x.current ? now : parse(x.endDate) ?? now
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  return Math.max(0, months)
}
