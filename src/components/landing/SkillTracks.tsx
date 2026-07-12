import { skillTracks } from '@/lib/skillTracks'

export function SkillTracks() {
  return (
    <section id="skill-tracks" className="border-t border-ink-100 bg-ink-50/40 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            8 skill tracks, one score you can trust
          </h2>
          <p className="mt-3 text-base text-ink-500">
            Every track is built from real business scenarios, not textbook
            trivia &mdash; scored across Beginner to Expert difficulty.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {skillTracks.map((track) => (
            <div
              key={track.slug}
              className="group rounded-xl border border-ink-100 bg-white p-5 transition-colors hover:border-brand-200"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                {track.questionCount} scenarios
              </p>
              <h3 className="mt-2 text-base font-semibold text-ink-900">
                {track.name}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                {track.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
