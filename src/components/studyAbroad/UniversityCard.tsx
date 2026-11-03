import { Link } from '@tanstack/react-router'
import { ArrowRight, CalendarDays, Clock, GraduationCap, MapPin, Wallet } from 'lucide-react'
import { APPLICATION_STATUS, type StudyProgramme } from '@/lib/studyAbroad'
import { Flag } from './Cards'
import { cityPhoto } from './Photos'

/** "Our Lady of Good Counsel University (UNIZKM), Tirana" → its name and its city. */
function splitPlace(university: string): { name: string; city: string | null } {
  const at = university.lastIndexOf(', ')
  return at > 0 ? { name: university.slice(0, at), city: university.slice(at + 2) } : { name: university, city: null }
}

/**
 * A partner university, big (Paul, 4 Nov 2026: "just show partner
 * universities and make those card look big"): a photo of its city, its
 * name and where it is, and each of its programmes, one tap from applying.
 */
export function UniversityCard({ university, programmes }: { university: string; programmes: StudyProgramme[] }) {
  const first = programmes[0]
  const { name, city } = splitPlace(university)
  const photo = cityPhoto(first.country_code)
  const open = programmes.filter((p) => p.status === 'open').length

  return (
    <article className="card overflow-hidden lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* Where it is: a photo of the city, or the flag's colours when there is none. */}
      <div className="theme-light relative h-56 bg-gradient-to-br from-[#0b2a4a] to-[#0f4c5c] sm:h-64 lg:h-auto lg:min-h-[20rem]">
        {photo && <img src={photo} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
        <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Flag code={first.country_code} className="h-4 w-6" />
            {city ? `${city}, ${first.country}` : first.country}
          </p>
          {open > 0 && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-400 px-2.5 py-1 text-[11px] font-bold uppercase text-emerald-950">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-900" /> Admissions open
            </span>
          )}
        </div>
      </div>

      <div className="p-6 sm:p-8">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
          <GraduationCap size={14} /> Partner university
        </p>
        <h3 className="mt-2 font-display text-2xl font-semibold leading-tight text-ink-900 sm:text-3xl">{name}</h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-600">
          <MapPin size={14} /> {city ? `${city}, ${first.country}` : first.country}
        </p>

        <ul className="mt-6 space-y-3">
          {programmes.map((p) => (
            <li key={p.slug}>
              <Link
                to="/study-abroad/$slug"
                params={{ slug: p.slug }}
                className="group flex items-center gap-4 rounded-2xl border border-ink-900/[0.08] bg-white p-4 transition-colors hover:border-brand-300"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-lg font-semibold text-ink-900">{p.title}</span>
                    {p.my_status ? (
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-800">{APPLICATION_STATUS[p.my_status].label}</span>
                    ) : p.status === 'closed' ? (
                      <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-600">Closed</span>
                    ) : null}
                  </span>
                  {(p.level || p.field) && <span className="block text-sm text-ink-600">{[p.level, p.field].filter(Boolean).join(' · ')}</span>}
                  <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-600">
                    {p.duration && (
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} /> {p.duration}
                      </span>
                    )}
                    {p.intake && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={12} /> Starts {p.intake}
                      </span>
                    )}
                    {p.fees && (
                      <span className="inline-flex items-center gap-1">
                        <Wallet size={12} /> {p.fees}
                      </span>
                    )}
                  </span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-e1 transition-colors group-hover:bg-brand-700">
                  {p.my_status ? 'View' : 'Explore'} <ArrowRight size={15} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}
