import { createFileRoute } from '@tanstack/react-router'
import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { Pillars } from '@/components/landing/Pillars'
import { SkillTracks } from '@/components/landing/SkillTracks'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { CtaBanner } from '@/components/landing/CtaBanner'
import { Footer } from '@/components/landing/Footer'

/**
 * The Digital Marketing Programme's own page — what used to be the homepage,
 * moved here when / became the Personal & Professional Development page.
 * "How it works" and "Skill tracks" live together on this one page (they
 * used to be two homepage anchors in the nav).
 */
export const Route = createFileRoute('/digital-marketing')({
  component: DigitalMarketingPage,
})

function DigitalMarketingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Pillars />
        <SkillTracks />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  )
}
