import { createFileRoute } from '@tanstack/react-router'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

export const Route = createFileRoute('/terms')({
  component: TermsPage,
})

const UPDATED = 'September 6, 2026'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-semibold tracking-tight text-ink-900">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink-600">{children}</div>
    </section>
  )
}

function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-3 text-sm text-ink-500">Last updated: {UPDATED}</p>

        <p className="mt-6 text-[15px] leading-relaxed text-ink-600">
          These terms cover your use of MySkills at myskills.org.in. By creating an
          account or using the site, you agree to them.
        </p>

        <Section title="What MySkills is">
          <p>
            MySkills is a free platform for practicing and assessing digital marketing
            skills — scenario-based practice, an initial skills assessment with a
            certificate, and a community of mentors and (soon) partner companies and
            institutions.
          </p>
        </Section>

        <Section title="Your account">
          <ul className="list-disc space-y-2 pl-5">
            <li>You need an account to use most of MySkills, created with your email or via Google sign-in.</li>
            <li>You're responsible for keeping your login credentials secure and for activity under your account.</li>
            <li>Give us accurate information — your certificate and mentor matches rely on it.</li>
            <li>You must be old enough to legally consent to these terms in your country to create an account.</li>
          </ul>
        </Section>

        <Section title="Acceptable use">
          <p>Don't use MySkills to:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Impersonate someone else, or provide false information in your profile, mentor application, or certificate.</li>
            <li>Harass, abuse, or send inappropriate content to mentors, students, or other users.</li>
            <li>Attempt to access another user's account or data, or interfere with the platform's normal operation.</li>
            <li>Scrape, copy, or resell content or data from the platform without our permission.</li>
          </ul>
          <p>We can suspend or remove accounts that break these rules.</p>
        </Section>

        <Section title="Mentors and community features">
          <p>
            Mentors volunteer their time and are not MySkills employees. Advice given in
            mentor chats or applications is offered in good faith but isn't professional,
            legal, or financial advice, and MySkills isn't responsible for the content of
            that advice. Mentor chat messages are deleted permanently once a conversation
            ends, so keep your own notes on anything you want to remember.
          </p>
        </Section>

        <Section title="Certificates">
          <p>
            Your certificate reflects your performance on the MySkills assessment at the
            time you took it. It's a record of that assessment, not a professional
            credential or degree, and we make no guarantee about how any third party
            (employer, institution, etc.) will treat it.
          </p>
        </Section>

        <Section title="Content you submit">
          <p>
            You keep ownership of anything you upload (profile photos, bios, feedback,
            and so on), but you give us permission to store and display it as part of
            running MySkills — for example, showing your mentor profile to other users.
          </p>
        </Section>

        <Section title="Service availability">
          <p>
            MySkills is provided &ldquo;as is&rdquo;. We aim to keep it available and
            working correctly, but we don't guarantee uninterrupted access, and features
            marked &ldquo;coming soon&rdquo; (like internships and institution partnerships)
            aren't a promise of a specific launch date.
          </p>
        </Section>

        <Section title="Ending your account">
          <p>
            You can stop using MySkills at any time. To have your account and data
            deleted, email us — see the contact details below. We may suspend or
            terminate accounts that violate these terms.
          </p>
        </Section>

        <Section title="Changes to these terms">
          <p>
            If we make material changes, we'll update the date at the top of this page.
            Continuing to use MySkills after a change means you accept the updated terms.
          </p>
        </Section>

        <Section title="Contact us">
          <p>
            Questions about these terms? Email us at{' '}
            <a href="mailto:myskillsfounder@gmail.com" className="font-medium text-brand-700 hover:text-brand-800">
              myskillsfounder@gmail.com
            </a>
            .
          </p>
        </Section>
      </main>

      <Footer />
    </div>
  )
}
