/**
 * Public blog reads. Only PUBLISHED posts are visible to anon (enforced by RLS
 * on blog_posts), so these queries are safe to run from the marketing site.
 * Posts are authored in /admin/blog, gated to admins by RLS
 * (docs/supabase-security-fixes.sql) — but that content is still rendered via
 * dangerouslySetInnerHTML (routes/blog/$slug.tsx), so it's sanitized here too
 * as defense-in-depth against a compromised admin session or a copy-pasted
 * snippet with embedded script the admin didn't intend to publish.
 */
import { supabase } from './supabase'

// Formatting tags a blog post legitimately needs. Anything else is unwrapped
// (its children survive, the tag itself doesn't) rather than treated as an
// error — admin-pasted markup shouldn't lose content over an unknown tag.
const ALLOWED_TAGS = new Set([
  'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'UL', 'OL', 'LI', 'A', 'IMG', 'BLOCKQUOTE', 'CODE', 'PRE', 'HR', 'SPAN', 'DIV',
  'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'FIGURE', 'FIGCAPTION',
])

// Tags dropped along with their whole subtree — either inherently executable
// (script, form controls) or able to smuggle executable content past the
// attribute filter below (svg can carry an embedded <script> of its own).
const STRIP_ENTIRELY = new Set([
  'SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'INPUT', 'BUTTON',
  'TEXTAREA', 'SELECT', 'LINK', 'META', 'BASE', 'SVG', 'MATH',
])

const ATTR_ALLOWLIST = new Set(['alt', 'title', 'colspan', 'rowspan'])
const SAFE_URL = /^(https?:|mailto:|tel:|#|\/)/i

function sanitizeUrl(value: string | null): string | null {
  const v = (value ?? '').trim()
  if (!v) return null
  return SAFE_URL.test(v) ? v : null
}

function sanitizeChildren(root: Element): void {
  // Snapshot up front — unwrapping/removing a node while iterating its
  // parent's live childNodes would skip whatever shifts into its place.
  for (const node of Array.from(root.childNodes)) {
    if (node.nodeType === Node.COMMENT_NODE) {
      node.remove()
      continue
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue
    const el = node as Element

    if (STRIP_ENTIRELY.has(el.tagName)) {
      el.remove()
      continue
    }

    sanitizeChildren(el) // depth-first, so a doomed wrapper's children are still cleaned before it's unwrapped

    if (!ALLOWED_TAGS.has(el.tagName)) {
      el.replaceWith(...Array.from(el.childNodes))
      continue
    }

    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase()
      if (name === 'href' || name === 'src') {
        const safe = sanitizeUrl(attr.value)
        if (safe) el.setAttribute(attr.name, safe)
        else el.removeAttribute(attr.name)
      } else if (!ATTR_ALLOWLIST.has(name)) {
        // Covers event handlers (onerror, onclick, ...), style (expression()/
        // javascript: URLs in old engines), and anything else unrecognized.
        el.removeAttribute(attr.name)
      }
    }
  }
}

/** Strips script tags, event handlers, and other executable content from
 *  admin-authored post bodies before they're injected into the page.
 *  Hand-rolled rather than a library — an allowlist walk over a DOMParser
 *  tree is enough for the plain-HTML posts this app produces, and it keeps
 *  the dependency tree untouched. Browser-only (DOMParser); this module is
 *  never imported by the Node-side prerender script. */
export function sanitizeBlogHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  sanitizeChildren(doc.body)
  return doc.body.innerHTML
}

export interface BlogPost {
  id: string
  title: string
  description: string
  slug: string
  thumbnail_url: string | null
  content: string
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
  published_at: string | null
}

/** Newest published posts first. */
export async function fetchPublishedPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as BlogPost[]
}

/** A single published post by slug, or null. */
export async function fetchPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  if (error) throw error
  return (data as BlogPost) ?? null
}

export function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
