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
/**
 * Quill v2 always exports list items as `<ol><li data-list="bullet|ordered">`
 * — bullet vs. ordered is a data attribute, not the wrapper tag — rendered
 * correctly only inside a document that also loads Quill's own CSS (the
 * `::before` on a child `.ql-ui` span draws the bullet/number). The public
 * post page doesn't load that stylesheet, and the sanitizer that runs before
 * publish (sanitizeBlogHtml) drops unrecognized attributes including
 * data-list — so without this, a "Bulleted list" built in this editor quietly
 * saves and publishes as a numbered one. Converts back to plain <ul>/<ol> so
 * the saved HTML means what the toolbar button said it would.
 */
function normalizeQuillLists(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  for (const list of Array.from(doc.querySelectorAll('ol'))) {
    let run: Element | null = null
    let runType: string | null = null
    for (const li of Array.from(list.children)) {
      li.querySelector('.ql-ui')?.remove()
      const type = li.getAttribute('data-list') === 'bullet' ? 'ul' : 'ol'
      li.removeAttribute('data-list')
      if (type !== runType || !run) {
        run = doc.createElement(type)
        list.before(run)
        runType = type
      }
      run.appendChild(li)
    }
    list.remove()
  }
  return doc.body.innerHTML
}

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
    // Same class the public post page renders content with (see index.css),
    // so the editor is a true WYSIWYG preview instead of showing Quill's
    // generic default typography — which resets heading/paragraph margins to
    // 0 — while the live post uses the site's actual heading spacing.
    quill.root.classList.add('blog-content')
    // Not quill.root.innerHTML = value: that bypasses Quill's own HTML parser,
    // so tags it doesn't already recognize as a matching Delta (plain
    // hand-authored <ul>/<ol> from before this editor existed, in particular)
    // silently vanish the moment Quill's MutationObserver reconciles the DOM
    // against its internal model. Routing it through the clipboard parser is
    // the supported way to hydrate arbitrary saved HTML.
    quill.clipboard.dangerouslyPasteHTML(value)
    quill.on('text-change', () =>
      onChangeRef.current(normalizeQuillLists(quill.root.innerHTML)),
    )

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
      className="rte-editor [&_.ql-container]:min-h-[320px] [&_.ql-container]:rounded-b-xl [&_.ql-container]:border-ink-200 [&_.ql-container]:text-sm [&_.ql-toolbar]:rounded-t-xl [&_.ql-toolbar]:border-ink-200"
    />
  )

  if (!label) return editor
  return (
    <Field label={label} hint={hint} required>
      {editor}
    </Field>
  )
}
