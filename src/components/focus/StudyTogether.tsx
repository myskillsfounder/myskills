const TOGETHER = [
  { title: 'Pick your room', body: 'Each room is one course, so the people there are studying what you are.' },
  { title: 'Say what you’re on', body: 'A module, a quiz or your project. It shows under your camera, so others can find you.' },
  { title: 'Study side by side', body: 'Camera on, no sound. Working next to others makes it easier to start and keep going.' },
  { title: 'Ask and help', body: 'Post a doubt and get answers from peers. The most upvoted doubts rise to the top.' },
]

/** Why study in a room, and how it works. Shown under the rooms. */
export function StudyTogether() {
  return (
    <section className="card p-5 sm:p-8">
      <h2 className="font-display text-xl font-semibold text-ink-900 sm:text-2xl">Study Online, together</h2>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-600">
        Studying with peers and like-minded people is great. You don’t have to study alone: pick a room, join others working on the same course, and get more done side by side.
      </p>
      <ol className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {TOGETHER.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-600 font-display text-sm font-semibold text-white">{i + 1}</span>
            <span>
              <span className="block font-semibold text-ink-900">{s.title}</span>
              <span className="mt-0.5 block text-sm leading-relaxed text-ink-600">{s.body}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
