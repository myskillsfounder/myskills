/**
 * Export the certificate as a standalone image file.
 *
 * The page used to call `window.print()`, which printed the whole document —
 * browser headers, page margins, surrounding chrome — and did essentially
 * nothing on mobile, where print support is poor to non-existent.
 *
 * The certificate is a single self-contained SVG (fixed viewBox, no external
 * images, inline colours), so it can be serialised, rasterised on a canvas and
 * saved as a PNG with no dependencies and no server round-trip.
 */

/** Native pixel size of the certificate artboard. */
const ART_W = 1120
const ART_H = 790

/** 3x gives ~3360x2370 — crisp when printed at A4 landscape. */
const DEFAULT_SCALE = 3

/**
 * Clone the live SVG into a standalone document string.
 *
 * Two things must change on the clone:
 *  - explicit width/height, because Safari refuses to rasterise an SVG image
 *    without intrinsic dimensions;
 *  - the drop-shadow filter is dropped, since a page-level shadow would be
 *    baked into the exported file (and clipped at the edges).
 */
function serialize(svg: SVGSVGElement, scale: number): string {
  const clone = svg.cloneNode(true) as SVGSVGElement

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
  clone.setAttribute('width', String(ART_W * scale))
  clone.setAttribute('height', String(ART_H * scale))
  clone.setAttribute('viewBox', `0 0 ${ART_W} ${ART_H}`)
  clone.removeAttribute('class')
  clone.style.filter = 'none'

  return new XMLSerializer().serializeToString(clone)
}

/** Rasterise the certificate to a PNG blob. */
export async function certificateToPng(
  svg: SVGSVGElement,
  scale: number = DEFAULT_SCALE,
): Promise<Blob> {
  const source = serialize(svg, scale)
  const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }))

  try {
    const img = new Image()
    img.decoding = 'sync'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Could not render the certificate image.'))
      img.src = url
    })

    const canvas = document.createElement('canvas')
    canvas.width = ART_W * scale
    canvas.height = ART_H * scale

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas is not available in this browser.')

    // The artwork already paints its own background, but fill white first so a
    // failed paint can never produce a transparent (black-on-share) image.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the image.'))),
        'image/png',
      )
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Save the certificate.
 *
 * On phones the Web Share sheet is the route that actually works — iOS Safari
 * ignores `<a download>` for blobs, so a plain download link silently opens the
 * image in a tab instead of saving it. Where sharing files isn't supported we
 * fall back to the download link, which is fine on desktop and Android.
 */
export async function saveCertificate(svg: SVGSVGElement, code: string): Promise<void> {
  const blob = await certificateToPng(svg)
  const filename = `MySkills-Certificate-${code}.png`
  const file = new File([blob], filename, { type: 'image/png' })

  const nav = navigator as Navigator & {
    canShare?: (data: { files?: File[] }) => boolean
    share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>
  }

  if (nav.canShare?.({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file], title: 'MySkills Certificate' })
      return
    } catch (err) {
      // User dismissed the sheet — not an error worth surfacing.
      if (err instanceof DOMException && err.name === 'AbortError') return
      // Anything else: fall through to the download link.
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke on the next tick so Safari has time to start the download.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
