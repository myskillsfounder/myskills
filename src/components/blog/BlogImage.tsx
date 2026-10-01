import { useState } from 'react'
import { sizedImage } from '@/lib/blog'

/**
 * A post's thumbnail, asked for at the width it is shown rather than the
 * full-size upload. Three steps down if anything fails: the resized image,
 * then the original file, then a quiet gradient instead of the browser's
 * broken-image icon.
 */
export function BlogImage({
  url,
  width,
  eager = false,
  className = '',
}: {
  url: string | null
  /** Pixels to ask for: about twice the widest it is displayed, for sharp screens. */
  width: number
  /** The first image on the page loads straight away; the rest wait until they are near the screen. */
  eager?: boolean
  className?: string
}) {
  const [stage, setStage] = useState<'sized' | 'original' | 'none'>('sized')

  if (!url || stage === 'none') {
    return <div aria-hidden className={`bg-gradient-to-br from-brand-900/40 via-ink-800 to-ink-900 ${className}`} />
  }
  const sized = sizedImage(url, width)
  const src = stage === 'sized' ? sized : url
  return (
    <img
      src={src}
      alt=""
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : 'auto'}
      className={className}
      onError={() => setStage(stage === 'sized' && sized !== url ? 'original' : 'none')}
    />
  )
}
