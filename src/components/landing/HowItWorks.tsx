import { UserPlus, ClipboardCheck, LineChart } from 'lucide-react'

const steps = [
  {
    icon: UserPlus,
    title: 'Create your profile',
    description:
      'Sign up with Google or email, and complete a short onboarding to tell us where you’re starting from.',
  },
  {
    icon: ClipboardCheck,
    title: 'Take the initial assessment',
    description:
      'A one-time diagnostic across all 8 tracks. Complete it once to unlock every practice assessment.',
  },
  {
    icon: LineChart,
    title: 'Practice and track mastery',
    description:
      'Work through scenario-based Decision Labs, get weighted scores by difficulty, and watch your dashboard improve.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            How MySkills works
          </h2>
          <p className="mt-3 text-base text-ink-500">
            Three steps between signing up and knowing exactly what to
            practice next.
          </p>
        </div>

        <ol className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
          {steps.map((step, i) => (
            <li key={step.title} className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-900 text-white">
                <step.icon size={18} />
              </div>
              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-brand-600">
                Step {i + 1}
              </p>
              <h3 className="mt-1 text-base font-semibold text-ink-900">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
