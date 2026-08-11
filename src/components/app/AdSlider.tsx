import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useActiveAds, type Ad } from '@/lib/ads'

const AUTO_MS = 5000

/**
 * Sidebar advertising slider (replaced the static "Guided weekly rhythm" card).
 * Auto-rotates and has manual prev/next arrows (no dots). Renders nothing when
 * there are no active ads, so the sidebar simply omits it. Ads with a link_url
 * open that URL in a new tab; ads without one are just images.
 */
export function AdSlider() {
  const ads = useActiveAds()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const count = ads.length

  // Keep the index in range if the ad list changes under us.
  useEffect(() => {
    if (index >= count) setIndex(0)
  }, [count, index])

  // Auto-advance, unless paused (hover) or there's only one ad.
  useEffect(() => {
    if (count <= 1 || paused) return
    const t = window.setInterval(() => setIndex((i) => (i + 1) % count), AUTO_MS)
    return () => window.clearInterval(t)
  }, [count, paused])

  if (count === 0) return null

  const current = ads[Math.min(index, count - 1)]
  const go = (dir: -1 | 1) => setIndex((i) => (i + dir + count) % count)

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-ink-100 bg-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Sponsored"
    >
      <AdSlide ad={current} />

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous ad"
            className="absolute left-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink-700 shadow-sm backdrop-blur transition-colors hover:bg-white hover:text-brand-600"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next ad"
            className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink-700 shadow-sm backdrop-blur transition-colors hover:bg-white hover:text-brand-600"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}
    </div>
  )
}

function AdSlide({ ad }: { ad: Ad }) {
  const inner = (
    <img
      src={ad.image_url}
      alt=""
      loading="lazy"
      className="aspect-video w-full object-cover"
    />
  )

  if (ad.link_url) {
    return (
      <a href={ad.link_url} target="_blank" rel="noreferrer noopener" className="block">
        {inner}
      </a>
    )
  }
  return <div>{inner}</div>
}
