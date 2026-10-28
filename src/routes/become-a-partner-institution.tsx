import { createFileRoute } from '@tanstack/react-router'
import { Building2 } from 'lucide-react'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { PartnerDetails, PartnerFaq, PartnerHero, partnerPage } from '@/components/partner/PartnerLanding'
import { PartnerSignup } from '@/components/partner/PartnerSignup'

// Public on purpose: it is where an institution first hears what partnering
// with MySkills is. It takes no application: like every partner page, it sends
// people to the Community portal's sign-up, and the team verifies the account.
const page = partnerPage('institutions')

export const Route = createFileRoute('/become-a-partner-institution')({
  component: BecomeAPartnerInstitutionPage,
})

function BecomeAPartnerInstitutionPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        <PartnerHero page={page} icon={Building2} breadcrumb="Partner institutions" signup="institutions" />
        <PartnerDetails page={page} />
        <PartnerFaq faqs={page.faqs} />
        <PartnerSignup
          page={page}
          role="institutions"
          title="Create your partner account"
          body="It takes a few minutes. Every institution is verified by the MySkills team before students can see its listing, so students know it is real."
          signIn="Already a partner? Sign in"
        />
      </main>

      <Footer />
    </div>
  )
}
