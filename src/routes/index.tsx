import { createFileRoute } from '@tanstack/react-router'
import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { SkillTracks } from '@/components/landing/SkillTracks'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { CtaBanner } from '@/components/landing/CtaBanner'
import { Footer } from '@/components/landing/Footer'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <SkillTracks />
        <HowItWorks />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  )
}
