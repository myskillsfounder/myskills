import type { ComponentType } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight, CheckCircle2, ChevronDown } from 'lucide-react'
import { GridBackdrop } from '@/components/landing/GridBackdrop'
import content from '@/content/partner-pages.json'

/**
 * The text of the three partner pages lives in src/content/partner-pages.json,
 * which scripts/generate-seo.mjs also reads to write the same words into the
 * prerendered HTML — so what a search engine indexes is exactly what a visitor
 * sees, and editing the copy means editing one file.
 */
export type PartnerKey = 'mentors' | 'institutions' | 'companies'
export type PartnerPage = (typeof content)[PartnerKey]
type IconType = ComponentType<{ size?: number; className?: string }>

export const partnerPage = (key: PartnerKey): PartnerPage => content[key]
export const hubPage = content.hub

function Breadcrumb({ current }: { current: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-white/60">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <li>
          <Link to="/" className="hover:text-white">
            Home
          </Link>
        </li>
        <li aria-hidden>›</li>
        <li>
          <Link to="/community" className="hover:text-white">
            Partner with MySkills
          </Link>
        </li>
        <li aria-hidden>›</li>
        <li aria-current="page" className="text-white/90">
          {current}
        </li>
      </ol>
    </nav>
  )
}

/** The page's H1, a one-paragraph pitch and a button that jumps to the form. */
export function PartnerHero({ page, icon: Icon, breadcrumb }: { page: PartnerPage; icon: IconType; breadcrumb: string }) {
  return (
    <section className="surface-wood-dark relative overflow-hidden">
      <GridBackdrop mask="ellipse 75% 65% at 30% 20%" />
      <div className="relative mx-auto max-w-4xl px-4 pb-14 pt-8 sm:px-6 sm:pb-20 sm:pt-12 lg:px-8">
        <Breadcrumb current={breadcrumb} />
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-e1">
          <Icon size={22} />
        </span>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-200">{page.eyebrow}</p>
        <h1 className="mt-2 font-display text-[2rem] font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl">
          {page.h1}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">{page.intro}</p>
        <a
          href="#apply"
          className="press mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-[15px] font-semibold text-ink-900 shadow-e2 transition-colors hover:bg-brand-50"
        >
          {page.cta}
          <ArrowRight size={17} />
        </a>
      </div>
    </section>
  )
}

/** Benefits, how it works, and who we're looking for. */
export function PartnerDetails({ page }: { page: PartnerPage }) {
  return (
    <div className="surface-paper">
      <div className="mx-auto max-w-4xl space-y-14 px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <section aria-labelledby="benefits">
          <h2 id="benefits" className="font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            {page.benefitsTitle}
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {page.benefits.map((b) => (
              <li key={b.title} className="card p-5 sm:p-6">
                <h3 className="font-display text-lg font-semibold text-ink-900">{b.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{b.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="steps">
          <h2 id="steps" className="font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            {page.stepsTitle}
          </h2>
          <ol className="mt-6 space-y-4">
            {page.steps.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span
                  aria-hidden
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 font-display text-sm font-semibold text-white"
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-ink-900">{s.title}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-ink-600">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="looking-for">
          <h2 id="looking-for" className="font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            {page.lookingForTitle}
          </h2>
          <ul className="mt-6 space-y-3">
            {page.lookingFor.map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-ink-700">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brand-600" />
                {line}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

/** Questions as native <details>: the answers are in the page for search
 *  engines and screen readers, and collapsed for everyone else. */
export function PartnerFaq({ faqs, title = 'Questions' }: { faqs: { q: string; a: string }[]; title?: string }) {
  return (
    <section aria-labelledby="faq" className="surface-paper border-t border-ink-900/[0.06]">
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <h2 id="faq" className="font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
          {title}
        </h2>
        <div className="mt-6 divide-y divide-ink-900/[0.08] rounded-2xl border border-ink-900/[0.08] bg-white">
          {faqs.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-ink-900 [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown size={18} className="shrink-0 text-ink-500 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
