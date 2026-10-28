import { createFileRoute } from '@tanstack/react-router'
import { Briefcase } from 'lucide-react'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { PartnerDetails, PartnerFaq, PartnerHero, partnerPage } from '@/components/partner/PartnerLanding'
import { PartnerSignup } from '@/components/partner/PartnerSignup'

// Public on purpose: it is where a company first hears what offering
// internships through MySkills is. It takes no application: like every partner
// page, it sends people to the Community portal's sign-up, and the team
// verifies the account.
const page = partnerPage('companies')

export const Route = createFileRoute('/become-an-internship-partner')({
  component: BecomeAnInternshipPartnerPage,
})

function BecomeAnInternshipPartnerPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        <PartnerHero page={page} icon={Briefcase} breadcrumb="Internship partners" signup="internships" />
        <PartnerDetails page={page} />
        <PartnerFaq faqs={page.faqs} />
        <PartnerSignup
          page={page}
          role="internships"
          title="Create your partner account"
          body="It takes a few minutes. Every company is verified by the MySkills team before it can post internships, so students know the roles are real."
          signIn="Already a partner? Sign in"
        />
      </main>

      <Footer />
    </div>
  )
}
