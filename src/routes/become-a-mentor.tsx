import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, BadgeCheck, GraduationCap, MailCheck, ShieldCheck, UserPlus } from 'lucide-react'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { PartnerDetails, PartnerFaq, PartnerHero, partnerPage } from '@/components/partner/PartnerLanding'

// Public on purpose: it is where a mentor first hears what mentoring on
// MySkills is. It no longer takes an application. There is one way to become a
// mentor: create an account, confirm the email, and be verified by the team,
// so this page ends by sending people to that sign-up.
const page = partnerPage('mentors')

export const Route = createFileRoute('/become-a-mentor')({
  component: BecomeAMentorPage,
})

const STEP_ICONS = [UserPlus, MailCheck, ShieldCheck, BadgeCheck]

function BecomeAMentorPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        <PartnerHero page={page} icon={GraduationCap} breadcrumb="Mentors" />
        <PartnerDetails page={page} />
        <PartnerFaq faqs={page.faqs} />

        {/* Where the hero's button lands: the sign-up, and what it leads to. */}
        <div id="apply" className="surface-paper scroll-mt-16 border-t border-ink-900/[0.06]">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <div className="card overflow-hidden">
              <div className="p-6 sm:p-8">
                <h2 className="font-display text-2xl font-semibold leading-tight text-ink-900 sm:text-3xl">
                  Create your mentor account
                </h2>
                <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-600">
                  It takes a few minutes. Every mentor is verified by the MySkills team before students can see them, so
                  students know the person on the card is real.
                </p>

                <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {page.steps.slice(0, 4).map((s, i) => {
                    const Icon = STEP_ICONS[i % STEP_ICONS.length]
                    return (
                      <li key={s.title} className="rounded-xl bg-ink-50 p-4">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
                          <Icon size={17} />
                        </span>
                        <p className="mt-3 text-sm font-semibold text-ink-900">
                          {i + 1}. {s.title}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-ink-600">{s.body}</p>
                      </li>
                    )
                  })}
                </ol>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
                  <Link
                    to="/community-portal/signup"
                    search={{ role: 'mentor' }}
                    className="press inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-600 px-7 text-[15px] font-semibold text-white transition-colors hover:bg-brand-700"
                  >
                    {page.cta}
                    <ArrowRight size={17} />
                  </Link>
                  <Link to="/community-portal/login" className="text-center text-sm font-semibold text-brand-700 hover:underline">
                    Already a mentor? Sign in
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
