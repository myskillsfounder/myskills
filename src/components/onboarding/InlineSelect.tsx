import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import type { SentenceOption } from '@/lib/onboardingContent'

/**
 * A dropdown that lives inside a sentence: a chip showing the current choice
 * (or a dashed "choose…" while empty) that opens a list of options. Built as a
 * real listbox — arrow keys, Home/End, Enter or Space to choose, Escape to
 * close, click outside to dismiss — rather than a native <select>, which can't
 * be styled to match the dark surface.
 */
export function InlineSelect({
  value,
  options,
  onChange,
  placeholder,
  label,
  icon,
}: {
  value: string
  options: SentenceOption[]
  onChange: (id: string) => void
  /** Shown in the chip until something is chosen. */
  placeholder: string
  /** Names the control for screen readers, e.g. "Where you are right now". */
  label: string
  /** An icon for each option's row in the list. */
  icon?: (id: string) => ReactNode
}) {
  const uid = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  // How far to shift the list sideways so it stays fully on screen.
  const [offset, setOffset] = useState(0)
  const root = useRef<HTMLSpanElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const selected = options.find((o) => o.id === value)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Take focus when it opens, and keep the list on screen: it starts at the
  // chip's left edge and is shifted just enough to sit inside the viewport,
  // wherever the chip landed when the sentence wrapped.
  useLayoutEffect(() => {
    if (!open) return
    // preventScroll: focusing a list that starts partly off-screen would make
    // the browser scroll the page's clipped container to reveal it, and the
    // measurement below would then be taken from a shifted layout.
    list.current?.focus({ preventScroll: true })
    const chip = root.current?.getBoundingClientRect()
    const width = list.current?.offsetWidth
    if (!chip || !width) return
    const left = Math.max(8, Math.min(chip.left, window.innerWidth - width - 8))
    setOffset(left - chip.left)
  }, [open])

  // Keep the highlighted option visible by scrolling the list itself. Not
  // scrollIntoView: that also scrolls every clipped ancestor sideways, which
  // shifts the whole sentence under the list.
  useEffect(() => {
    if (!open) return
    const el = document.getElementById(`${uid}-${active}`)
    const box = list.current
    if (!el || !box) return
    const top = el.offsetTop
    const bottom = top + el.offsetHeight
    if (top < box.scrollTop) box.scrollTop = top
    else if (bottom > box.scrollTop + box.clientHeight) box.scrollTop = bottom - box.clientHeight
  }, [open, active, uid])

  function openList() {
    setActive(Math.max(0, options.findIndex((o) => o.id === value)))
    setOpen(true)
  }

  function choose(i: number) {
    onChange(options[i].id)
    setOpen(false)
    button.current?.focus()
  }

  function onListKey(e: KeyboardEvent) {
    const n = options.length
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActive((a) => (a + 1) % n)
        break
      case 'ArrowUp':
        e.preventDefault()
        setActive((a) => (a - 1 + n) % n)
        break
      case 'Home':
        e.preventDefault()
        setActive(0)
        break
      case 'End':
        e.preventDefault()
        setActive(n - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        choose(active)
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        button.current?.focus()
        break
      case 'Tab':
        setOpen(false)
        break
    }
  }

  return (
    <span ref={root} className="relative inline-block align-baseline">
      <button
        ref={button}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${selected ? selected.label : 'not chosen yet'}`}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault()
            openList()
          }
        }}
        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-0.5 font-display transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/70 ${
          selected
            ? 'border-brand-400/50 bg-brand-500/20 text-white hover:bg-brand-500/30'
            : 'border-dashed border-white/35 text-white/55 hover:border-white/60 hover:text-white/80'
        } ${open ? 'ring-2 ring-brand-300/60' : ''}`}
      >
        <span>{selected ? selected.chip : placeholder}</span>
        <ChevronDown size={18} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          ref={list}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${uid}-${active}`}
          onKeyDown={onListKey}
          style={{ left: offset }}
          className="absolute top-full z-30 mt-2 max-h-[min(22rem,60vh)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-white/15 bg-ink-900/95 p-1.5 font-sans text-base shadow-2xl backdrop-blur-xl [scrollbar-color:rgba(255,255,255,0.25)_transparent] [scrollbar-width:thin] focus:outline-none"
        >
          {options.map((o, i) => {
            const on = o.id === value
            return (
              <li
                key={o.id}
                id={`${uid}-${i}`}
                role="option"
                aria-selected={on}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={`flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 ${
                  i === active ? 'bg-white/10' : ''
                }`}
              >
                {icon && (
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-200">
                    {icon(o.id)}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold leading-snug text-white">{o.label}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-white/55">{o.description}</span>
                </span>
                {on && <Check size={16} className="mt-1 shrink-0 text-brand-200" />}
              </li>
            )
          })}
        </ul>
      )}
    </span>
  )
}
