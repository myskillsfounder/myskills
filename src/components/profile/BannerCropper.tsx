import { useEffect, useMemo, useRef, useState } from 'react'
import { ZoomIn, ZoomOut } from 'lucide-react'
import { Modal, PrimaryButton } from './ui'

interface Size {
  w: number
  h: number
}

interface Offset {
  x: number
  y: number
}

/** Keep the image covering the frame at all times -- no gaps at any edge. */
function clampOffset(offset: Offset, frame: Size, displayed: Size): Offset {
  const minX = frame.w - displayed.w
  const minY = frame.h - displayed.h
  return {
    x: Math.min(0, Math.max(minX, offset.x)),
    y: Math.min(0, Math.max(minY, offset.y)),
  }
}

/**
 * Drag-to-reposition, slider-to-zoom banner cropper. A fixed-height banner
 * box combined with widely varying source image shapes was cropping out
 * whatever the uploader actually cared about (a headline, a face) with no
 * way to fix it -- this lets them choose what shows before it's saved,
 * rather than uploading blind and hoping object-cover picks the right spot.
 *
 * Pure canvas + pointer events, no cropping library: the app doesn't pull
 * in image-editing dependencies elsewhere, and the math here is simple
 * enough not to need one.
 */
export function BannerCropper({
  file,
  aspectRatio = 4,
  outputWidth = 1600,
  onCancel,
  onCropped,
}: {
  file: File
  /** width / height of the crop frame -- must match how the banner actually
   *  renders on the profile page, or the crop won't mean what it looks like. */
  aspectRatio?: number
  outputWidth?: number
  onCancel: () => void
  onCropped: (file: File) => void | Promise<void>
}) {
  const [imgUrl, setImgUrl] = useState<string>()
  const [natural, setNatural] = useState<Size | null>(null)
  const [frame, setFrame] = useState<Size>({ w: 0, h: 0 })
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 })
  const [saving, setSaving] = useState(false)

  const frameRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const drag = useRef<{ startX: number; startY: number; offX: number; offY: number } | null>(null)

  // Load the file into an object URL and read its natural dimensions.
  useEffect(() => {
    const url = URL.createObjectURL(file)
    setImgUrl(url)
    const img = new Image()
    img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Track the frame's actual rendered width (it's fluid, the modal isn't).
  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const update = () => setFrame({ w: el.clientWidth, h: el.clientWidth / aspectRatio })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [aspectRatio])

  const baseScale = useMemo(() => {
    if (!natural || !frame.w) return 0
    return Math.max(frame.w / natural.w, frame.h / natural.h)
  }, [natural, frame])

  const displayed: Size = useMemo(
    () => (natural ? { w: natural.w * baseScale * zoom, h: natural.h * baseScale * zoom } : { w: 0, h: 0 }),
    [natural, baseScale, zoom],
  )

  // Center the image the first time we know both its size and the frame's.
  useEffect(() => {
    if (!natural || !frame.w) return
    setOffset({ x: (frame.w - displayed.w) / 2, y: (frame.h - displayed.h) / 2 })
    // Only re-center on a genuinely new image/frame, not on every zoom tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [natural, frame.w])

  function handleZoom(next: number) {
    if (!natural) return
    const nextDisplayed = { w: natural.w * baseScale * next, h: natural.h * baseScale * next }
    setZoom(next)
    setOffset((o) => clampOffset(o, frame, nextDisplayed))
  }

  function onPointerDown(e: React.PointerEvent) {
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    drag.current = { startX: e.clientX, startY: e.clientY, offX: offset.x, offY: offset.y }
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return
    const next = { x: drag.current.offX + (e.clientX - drag.current.startX), y: drag.current.offY + (e.clientY - drag.current.startY) }
    setOffset(clampOffset(next, frame, displayed))
  }
  function onPointerUp() {
    drag.current = null
  }

  async function handleSave() {
    if (!natural || !imgRef.current || !baseScale) return
    setSaving(true)
    try {
      const displayedScale = baseScale * zoom
      const outputHeight = Math.round(outputWidth / aspectRatio)
      const canvas = document.createElement('canvas')
      canvas.width = outputWidth
      canvas.height = outputHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas is not supported in this browser.')

      ctx.drawImage(
        imgRef.current,
        -offset.x / displayedScale,
        -offset.y / displayedScale,
        frame.w / displayedScale,
        frame.h / displayedScale,
        0,
        0,
        outputWidth,
        outputHeight,
      )

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
      if (!blob) throw new Error('Could not process that image.')

      await onCropped(new File([blob], 'banner.jpg', { type: 'image/jpeg' }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open title="Reposition banner" onClose={onCancel}>
      <div className="space-y-4">
        <p className="text-sm text-ink-600">Drag to reposition, and use the slider to zoom in or out.</p>

        <div
          ref={frameRef}
          className="relative w-full touch-none select-none overflow-hidden rounded-xl bg-ink-200"
          style={{ aspectRatio: String(aspectRatio) }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {imgUrl && natural && frame.w > 0 && (
            <img
              ref={imgRef}
              src={imgUrl}
              alt=""
              draggable={false}
              className="absolute max-w-none cursor-grab active:cursor-grabbing"
              style={{ left: offset.x, top: offset.y, width: displayed.w, height: displayed.h }}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <ZoomOut size={16} className="shrink-0 text-ink-500" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoom(Number(e.target.value))}
            className="w-full accent-brand-600"
            aria-label="Zoom"
          />
          <ZoomIn size={16} className="shrink-0 text-ink-500" />
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-ink-300 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100"
          >
            Cancel
          </button>
          <PrimaryButton type="button" onClick={handleSave} disabled={saving || !natural}>
            {saving ? 'Saving…' : 'Save banner'}
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  )
}
