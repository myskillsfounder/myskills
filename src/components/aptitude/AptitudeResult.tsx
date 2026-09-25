import {
  APTITUDE_MAX,
  APTITUDE_MIN,
  LEVEL_TONE_DARK,
  READOUT,
  orderedAptitudes,
  strongestAptitude,
  trackNames,
  type AptitudeResult as Result,
} from '@/lib/dmAptitude'
import { SkillProfile } from '@/components/self-assessment/Profile'

/**
 * A learner's Digital Marketing aptitude profile — the shared dark result
 * view fed with the five aptitudes. Unlike Career Readiness it leads with the
 * strongest aptitude: this is about finding where marketing fits, so it
 * points at the skill tracks that lean on it.
 */
export function AptitudeResult({ result }: { result: Result }) {
  const top = strongestAptitude(result.scores)
  const tracks = trackNames(top)
  return (
    <SkillProfile
      skills={orderedAptitudes(result.scores).map((a) => ({
        key: a.key,
        name: a.name,
        score: a.score,
        level: a.level,
        readout: READOUT[a.key][a.level],
      }))}
      min={APTITUDE_MIN}
      max={APTITUDE_MAX}
      levelTone={LEVEL_TONE_DARK}
      start={{
        title: top.name,
        body: `It’s your strongest pull, so these skill tracks should feel the most natural: ${tracks.join(' and ')}. A good place to begin. Practice is now unlocked.`,
        cta: { to: '/practice', label: 'Start practising' },
      }}
      detail={{
        title: 'How marketing comes to you',
        intro:
          'Each aptitude is read from what you already notice and do. A starting point, not a grade — there’s no pass or fail, and every one of these can be built.',
      }}
      reflection={result.reflection ? { label: 'What you’re most curious about', text: result.reflection } : null}
      footnote="You get one attempt at this assessment. Next comes the Foundation assessment, which tests what you know — it opens after you’ve worked through some vocabulary."
    />
  )
}
