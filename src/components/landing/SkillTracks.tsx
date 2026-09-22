import { skillTracks } from '@/lib/skillTracks'
import { Eyebrow } from './Eyebrow'
import { GridBackdrop, GlowOrb } from './GridBackdrop'

export function SkillTracks() {
  return (
    <section id="skill-tracks" className="surface-wood-dark relative overflow-hidden border-t border-white/[0.06]">
      <GridBackdrop mask="ellipse 55% 45% at 10% 0%" />
      <GlowOrb className="-left-16 top-0 h-72 w-72" color="rgba(143,133,238,0.16)" />
      <GlowOrb className="-right-16 bottom-0 h-72 w-72" color="rgba(211,164,65,0.10)" />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-2xl">
          <Eyebrow dark>8 skill tracks</Eyebrow>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            8 skill tracks to learn and master, from SEO to Marketing Automation
          </h2>
          <p className="mt-3 text-base text-white/70">
            Every track is built from real business scenarios, not textbook
            trivia &mdash; scored across Beginner to Expert difficulty.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {skillTracks.map((track, i) => (
            <div key={track.slug} className="card-glass-dark p-5">
              <p className="font-mono text-[11px] font-bold uppercase tracking-wide text-brand-200">
                Track_{String(i + 1).padStart(2, '0')} · {track.questionCount} scenarios
              </p>
              <h3 className="mt-2 text-base font-semibold text-white">
                {track.name}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/70">
                {track.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
