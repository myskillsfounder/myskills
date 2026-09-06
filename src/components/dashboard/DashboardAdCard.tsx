import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useActiveAds, type Ad } from '@/lib/ads'

const AUTO_MS = 4000

/**
 * Wide promotional slider for the bottom of the dashboard — institution
 * offers, internships, and other partner placements. Same `ads` table and
 * /admin/ads editor as the sidebar's AdSlider, just a bigger, slower-paced
 * presentation for the main content column. Renders nothing when there are
 * no active ads.
 */
export function DashboardAdCard() {
  const ads = useActiveAds()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const count = ads.length

  useEffect(() => {
    if (index >= count) setIndex(0)
  }, [count, index])

  useEffect(() => {
    if (count <= 1 || paused) return
    const t = window.setInterval(() => setIndex((i) => (i + 1) % count), AUTO_MS)
    return () => window.clearInterval(t)
  }, [count, paused])

  if (count === 0) return null

  const current = ads[Math.min(index, count - 1)]
  const go = (dir: -1 | 1) => setIndex((i) => (i + dir + count) % count)

  return (
    <section
      className="card lift relative overflow-hidden p-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured partners"
    >
      <span className="absolute left-4 top-4 z-10 inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-700 shadow-e1 backdrop-blur">
        Featured
      </span>

      <AdPanel ad={current} />

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous"
            className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink-800 shadow-e1 backdrop-blur transition-colors hover:bg-white hover:text-brand-600"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next"
            className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink-800 shadow-e1 backdrop-blur transition-colors hover:bg-white hover:text-brand-600"
          >
            <ChevronRight size={18} />
          </button>

          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
            {ads.map((ad, i) => (
              <button
                key={ad.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/60 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function AdPanel({ ad }: { ad: Ad }) {
  const image = (
    <div className="relative aspect-[21/9] w-full sm:aspect-[3/1]">
      <img src={ad.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />
      {ad.title && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-900/80 via-ink-900/10 to-transparent px-5 pb-4 pt-10">
          <p className="font-display text-lg font-semibold text-white sm:text-xl">{ad.title}</p>
        </div>
      )}
    </div>
  )

  if (ad.link_url) {
    return (
      <a href={ad.link_url} target="_blank" rel="noreferrer noopener" className="block">
        {image}
      </a>
    )
  }
  return image
}
