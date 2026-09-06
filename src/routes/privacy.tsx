import { createFileRoute } from '@tanstack/react-router'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
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

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-ink-500">Last updated: {UPDATED}</p>

        <p className="mt-6 text-[15px] leading-relaxed text-ink-600">
          MySkills (&ldquo;we&rdquo;, &ldquo;us&rdquo;) provides a free digital marketing skills
          assessment and practice platform at myskills.org.in. This page explains what
          information we collect, why, and the choices you have about it.
        </p>

        <Section title="Information we collect">
          <p><strong className="font-semibold text-ink-800">Account information.</strong> When you sign up, we collect your name and email address, either directly or from your Google account if you sign in with Google.</p>
          <p><strong className="font-semibold text-ink-800">Profile information you add.</strong> Phone number, date of birth, gender, location, career stage, goals, skills, work experience, education, and any profile photo or banner image you upload. All of this is optional and entered at your own pace.</p>
          <p><strong className="font-semibold text-ink-800">Assessment and practice activity.</strong> Your answers, scores, and progress across skill tracks, used to generate your certificate and personalise what we recommend to you.</p>
          <p><strong className="font-semibold text-ink-800">Mentor and community activity.</strong> If you apply to become a mentor, we collect the details in that application. If you use &ldquo;Talk to a mentor&rdquo;, your chat messages are stored only for the duration of that conversation and are permanently deleted once the session ends.</p>
          <p><strong className="font-semibold text-ink-800">Usage data.</strong> We use Google Analytics to understand how the product is used (pages visited, time spent, general device/location information). This is aggregated and not used to identify you individually.</p>
        </Section>

        <Section title="How we use your information">
          <ul className="list-disc space-y-2 pl-5">
            <li>To run your account, save your progress, and issue your certificate.</li>
            <li>To personalise practice recommendations and connect you with mentors.</li>
            <li>To improve the product based on how it's actually used.</li>
            <li>To communicate with you about your account or, if you've opted in, product updates.</li>
          </ul>
          <p>We do not sell your personal information, and we do not use it for third-party advertising.</p>
        </Section>

        <Section title="Who we share it with">
          <p>We use a small number of service providers to run MySkills, and share only what each one needs to do its job:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li><strong className="font-semibold text-ink-800">Supabase</strong> — hosts our database, authentication, and file storage.</li>
            <li><strong className="font-semibold text-ink-800">Google</strong> — powers &ldquo;Sign in with Google&rdquo; (if you use it) and Google Analytics.</li>
          </ul>
          <p>We don't share your personal information with anyone else except where required by law.</p>
        </Section>

        <Section title="Cookies and local storage">
          <p>
            We use your browser's local storage to keep you signed in, remember an
            in-progress assessment so you don't lose your answers, and track a simple
            daily practice streak. We use Google Analytics' cookies to understand
            product usage in aggregate.
          </p>
        </Section>

        <Section title="Data retention">
          <p>
            We keep your account and profile information for as long as your account is
            active. Live mentor-chat messages are deleted automatically when a
            conversation ends. If you'd like your account and associated data deleted
            entirely, contact us using the details below.
          </p>
        </Section>

        <Section title="Your choices">
          <ul className="list-disc space-y-2 pl-5">
            <li>You can view and update most of your information directly from your Profile page at any time.</li>
            <li>You can request a copy of your data, or ask us to delete your account, by emailing us.</li>
            <li>If you signed up with Google, you can revoke MySkills' access at any time from your Google Account's security settings.</li>
          </ul>
        </Section>

        <Section title="Children's privacy">
          <p>
            MySkills is built for students and early-career professionals. It is not
            directed at children under 13, and we don't knowingly collect personal
            information from anyone under that age.
          </p>
        </Section>

        <Section title="Security">
          <p>
            We use industry-standard practices (encrypted connections, access controls,
            and a managed database provider) to protect your information. No system is
            perfectly secure, so we can't guarantee absolute security, but we take it
            seriously.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            If we make material changes to this policy, we'll update the date at the top
            of this page. Continuing to use MySkills after a change means you accept the
            updated policy.
          </p>
        </Section>

        <Section title="Contact us">
          <p>
            Questions about this policy, or want to access, correct, or delete your
            data? Email us at{' '}
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
