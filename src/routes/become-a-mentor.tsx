import { createFileRoute } from '@tanstack/react-router'
import { GraduationCap } from 'lucide-react'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { PartnerDetails, PartnerFaq, PartnerHero, partnerPage } from '@/components/partner/PartnerLanding'
import { PartnerSignup } from '@/components/partner/PartnerSignup'

// Public on purpose: it is where a mentor first hears what mentoring on
// MySkills is. It no longer takes an application. There is one way to become a
// mentor: create an account, confirm the email, and be verified by the team,
// so this page ends by sending people to that sign-up.
const page = partnerPage('mentors')

export const Route = createFileRoute('/become-a-mentor')({
  component: BecomeAMentorPage,
})

function BecomeAMentorPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        <PartnerHero page={page} icon={GraduationCap} breadcrumb="Mentors" signup="mentor" />
        <PartnerDetails page={page} />
        <PartnerFaq faqs={page.faqs} />
        <PartnerSignup
          page={page}
          role="mentor"
          title="Create your mentor account"
          body="It takes a few minutes. Every mentor is verified by the MySkills team before students can see them, so students know the person on the card is real."
          signIn="Already a mentor? Sign in"
        />
      </main>

      <Footer />
    </div>
  )
}
