/**
 * Digital Marketing aptitude assessment — the FIRST step of the programme.
 * See docs/supabase-dm-aptitude-assessment.sql.
 *
 * A quick look at whether marketing comes naturally: do you read billboards
 * when you travel, notice a struck-through price, follow what's trending.
 * The knowledge test that used to open the programme is now the Foundation
 * assessment, taken later. 20 statements, four per aptitude, each rated Never
 * / Sometimes / Often / Always (1-4); one per aptitude is reverse-scored.
 * Scoring happens in Postgres (submit_dm_aptitude_assessment), so the client
 * only reads results back. An aptitude scores 4-16.
 */
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { skillTracks } from './skillTracks'

export type AptitudeKey = 'noticing' | 'offers' | 'creativity' | 'numbers' | 'curiosity'

/** In the order the assessment cycles through them. `tracks` are the skill
 *  tracks (lib/skillTracks.ts) that lean most on the aptitude. */
export const APTITUDES: { key: AptitudeKey; name: string; tracks: string[] }[] = [
  { key: 'noticing', name: 'Noticing marketing', tracks: ['marketing-fundamentals', 'market-research'] },
  { key: 'offers', name: 'Why offers work', tracks: ['meta-ads', 'google-ads'] },
  { key: 'creativity', name: 'Creativity & storytelling', tracks: ['content-marketing', 'meta-ads'] },
  { key: 'numbers', name: 'Numbers & value', tracks: ['analytics', 'google-ads'] },
  { key: 'curiosity', name: 'Digital curiosity', tracks: ['marketing-automation-ai', 'seo-aeo'] },
]

/** Four statements per aptitude, 1-4 each. */
export const APTITUDE_MIN = 4
export const APTITUDE_MAX = 16

export interface AptitudeQuestion {
  id: string
  skill: AptitudeKey
  statement: string
}

export interface AptitudeResult {
  scores: Record<AptitudeKey, number>
  reflection: string | null
  completedAt: string | null
}

export type AptitudeLevel = 'Emerging' | 'Developing' | 'Strong' | 'Natural'

export function levelFor(score: number): AptitudeLevel {
  if (score >= 14) return 'Natural'
  if (score >= 11) return 'Strong'
  if (score >= 8) return 'Developing'
  return 'Emerging'
}

/** Pill colours for each level, on a dark surface. */
export const LEVEL_TONE_DARK: Record<AptitudeLevel, string> = {
  Emerging: 'bg-white/10 text-white/70',
  Developing: 'bg-amber-400/15 text-amber-200',
  Strong: 'bg-brand-400/20 text-brand-100',
  Natural: 'bg-emerald-400/15 text-emerald-300',
}

/** The aptitude the learner scored highest on (ties go to the first). It's
 *  what the result leads with: aptitude is about finding the fit, so it starts
 *  from the strength, not the gap. */
export function strongestAptitude(scores: Record<AptitudeKey, number>) {
  return APTITUDES.reduce((top, a) => ((scores[a.key] ?? 0) > (scores[top.key] ?? 0) ? a : top), APTITUDES[0])
}

/** The names of an aptitude's skill tracks, e.g. ["Meta Ads", "Google Ads"]. */
export function trackNames(aptitude: { tracks: string[] }): string[] {
  return aptitude.tracks
    .map((slug) => skillTracks.find((t) => t.slug === slug)?.name)
    .filter((n): n is string => Boolean(n))
}

/** Each aptitude with its score and level, in the order they were asked. */
export function orderedAptitudes(scores: Record<AptitudeKey, number>) {
  return APTITUDES.map((a) => ({
    ...a,
    score: scores[a.key] ?? 0,
    level: levelFor(scores[a.key] ?? 0),
  }))
}

/** Plain-language read-out for each aptitude at each level. */
export const READOUT: Record<AptitudeKey, Record<AptitudeLevel, string>> = {
  noticing: {
    Emerging:
      'Marketing is mostly background noise to you right now. Marketers train this like a muscle: pick one ad a day and ask what it’s trying to make you feel, and how.',
    Developing:
      'You notice ads when they’re striking, but not yet as a habit. Start reading the tagline, the colours and the call to action of the ads you’d usually skip.',
    Strong:
      'You notice how brands present themselves — colours, lines, layouts. Keep asking why a choice was made, not just that you saw it.',
    Natural:
      'You see marketing everywhere and remember what worked. That noticing instinct is the raw material of every good campaign.',
  },
  offers: {
    Emerging:
      'Deals and discounts mostly pass you by, or work on you without you noticing. Watching how prices and offers are framed is the first step to writing them.',
    Developing:
      'You spot some offers and sometimes wonder why they’re there. Next time, name the trick: urgency, a struck-out price, social proof, a reward.',
    Strong:
      'You notice how offers are built — the struck price, the cashback, the countdown — and you know they’re designed to move you.',
    Natural:
      'You read pricing and offers like a marketer already: what’s being anchored, what’s being nudged, and why it works on you.',
  },
  creativity: {
    Emerging:
      'Fresh ideas don’t come easily yet, and that’s trainable. Try rewriting one ad you saw today for a completely different audience.',
    Developing:
      'You have ideas and enjoy making things now and then. Turning an idea into one small, shareable thing every week builds the habit.',
    Strong:
      'You come up with ideas and can explain them well. Keep practising the story around an idea — that’s what makes it land.',
    Natural:
      'Ideas and stories come naturally, and you enjoy making things people look at. Campaigns need exactly that.',
  },
  numbers: {
    Emerging:
      'Numbers feel like a chore right now — and modern marketing runs on them. Start small: pick one metric, like views or clicks, and follow it for a week.',
    Developing:
      'You’ll look at numbers when you have to. Getting curious about the why behind a result is where it starts to click.',
    Strong:
      'You’re comfortable with numbers and like to know why something worked. That’s what analytics and ad-buying reward.',
    Natural:
      'You compare, measure and ask how much and why by instinct — a real advantage in ads and analytics.',
  },
  curiosity: {
    Emerging:
      'You mostly stick to what you know online. Marketing moves fast: try one new app or format a month and ask why people use it.',
    Developing:
      'You explore new things sometimes. Following a couple of marketing creators or newsletters keeps you in the loop without effort.',
    Strong:
      'You keep up with what’s new and notice what’s trending. Try spotting the pattern behind why things spread.',
    Natural:
      'You’re already living in the digital world marketers work in — trying things early and spotting what’s about to take off.',
  },
}

function fail(error: { message?: string }): never {
  throw new Error(error.message?.trim() || 'Something went wrong.')
}

/** The 20 statements, in the order they're asked. */
export async function fetchAptitudeQuestions(): Promise<AptitudeQuestion[]> {
  const { data, error } = await supabase
    .from('dm_aptitude_questions')
    .select('id, skill, statement')
    .order('sort_order', { ascending: true })
  if (error) fail(error)
  return (data ?? []) as AptitudeQuestion[]
}

/** The signed-in learner's result, or null if they haven't taken it. Before
 *  the SQL is run the table doesn't exist — that reads as "not taken", the
 *  same way the Career Readiness assessment does. */
export async function fetchMyAptitudeResult(): Promise<AptitudeResult | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('dm_aptitude_results')
    .select('scores, reflection, completed_at')
    .eq('profile_id', user.id)
    .maybeSingle()
  if (error || !data) return null
  return {
    scores: data.scores as Record<AptitudeKey, number>,
    reflection: data.reflection ?? null,
    completedAt: data.completed_at ?? null,
  }
}

/** Scores and saves server-side; rejects a second attempt. */
export async function submitAptitude(
  answers: Record<string, number>,
  reflection: string,
): Promise<AptitudeResult> {
  const { data, error } = await supabase.rpc('submit_dm_aptitude_assessment', {
    p_answers: answers,
    p_reflection: reflection.trim() || null,
  })
  if (error) fail(error)
  const r = data as { scores: Record<AptitudeKey, number>; reflection: string | null }
  return { scores: r.scores, reflection: r.reflection ?? null, completedAt: null }
}

/** Has the learner taken it? true / false, or null while we don't know yet.
 *  For places (the app-wide nudge) that only need the yes/no. */
export function useAptitudeDone(): boolean | null {
  const [done, setDone] = useState<boolean | null>(null)
  useEffect(() => {
    let active = true
    fetchMyAptitudeResult().then((r) => active && setDone(r != null))
    return () => {
      active = false
    }
  }, [])
  return done
}

/** Has the learner taken it? `loading` is true until we know. */
export function useMyAptitudeResult() {
  const [result, setResult] = useState<AptitudeResult | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    fetchMyAptitudeResult()
      .then((r) => active && setResult(r))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])
  return { result, loading, setResult }
}
