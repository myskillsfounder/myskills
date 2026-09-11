import { useEffect, useRef } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { Field } from '@/components/ui'

/**
 * Thin wrapper around Quill (vanilla, not react-quill — that wrapper has known
 * StrictMode/React 18+ double-mount issues, and Quill's own API is small
 * enough that hand-wiring it is simpler than working around someone else's
 * wrapper). Manages its own child DOM node rather than the ref'd container
 * directly, since Quill takes over and restructures whatever element it's
 * given — letting React and Quill fight over the same node causes the
 * classic "removeChild" crash on unmount.
 *
 * Content only hydrates once, on mount: every admin/blog.tsx edit session
 * mounts a fresh Editor (and so a fresh RichTextEditor) per post, so there's
 * no case here where `value` changes out from under an already-mounted
 * instance for a reason other than this editor's own onChange.
 */
export function RichTextEditor({
  value,
  onChange,
  label,
  hint,
}: {
  value: string
  onChange: (html: string) => void
  label?: string
  hint?: string
}) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const editorEl = document.createElement('div')
    wrapper.appendChild(editorEl)

    const quill = new Quill(editorEl, {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ header: [1, 2, false] }],
          ['bold', 'italic'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link'],
          ['clean'],
        ],
      },
    })
    quill.root.innerHTML = value
    quill.on('text-change', () => onChangeRef.current(quill.root.innerHTML))

    return () => {
      // Quill inserts its generated toolbar as a sibling of editorEl, not a
      // child of it — removing just editorEl leaves an orphaned toolbar
      // behind on every remount (very visible under StrictMode's dev-only
      // double-invoke). Clearing the whole wrapper removes both.
      wrapper.innerHTML = ''
    }
    // Mount-once by design — see comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const editor = (
    <div
      ref={wrapperRef}
      className="[&_.ql-container]:min-h-[320px] [&_.ql-container]:rounded-b-xl [&_.ql-container]:border-ink-200 [&_.ql-container]:text-sm [&_.ql-toolbar]:rounded-t-xl [&_.ql-toolbar]:border-ink-200"
    />
  )

  if (!label) return editor
  return (
    <Field label={label} hint={hint} required>
      {editor}
    </Field>
  )
}
