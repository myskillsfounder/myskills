/**
 * SEO metadata — one source of truth for both the runtime (SPA navigation)
 * and the build-time prerender script.
 *
 * WHY THIS EXISTS. The app is a client-rendered SPA: every URL serves the same
 * `index.html`, so without this every page shares one title and description,
 * and link previews on WhatsApp/LinkedIn/Slack show the same generic card.
 *
 * CANONICAL HOST. Both `myskills.org.in` and `www.myskills.org.in` currently
 * resolve, which search engines treat as two sites with duplicate content.
 * `SITE_URL` below is the one that counts; `public/.htaccess` 301-redirects the
 * other to it. Change both together if the canonical host ever changes.
 */

/** Canonical origin, no trailing slash. Overridable at build time. */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL ?? 'https://myskills.org.in'
).replace(/\/$/, '')

export const SITE_NAME = 'MySkills'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`

export interface PageSeo {
  title: string
  description: string
  /** Omit to fall back to DEFAULT_OG_IMAGE. */
  image?: string
  /** `noindex` for pages that shouldn't appear in search results. */
  noindex?: boolean
}

/**
 * Metadata per public route.
 *
 * Only routes listed here are indexable. Everything else — the whole signed-in
 * app — is marked noindex at runtime, because those pages are useless to a
 * search visitor (they'd hit a login wall) and dilute crawl budget.
 */
export const PAGE_SEO: Record<string, PageSeo> = {
  '/': {
    title: 'Free Digital Marketing Skill Assessment & Certification | MySkills',
    description:
      'Test your digital marketing skills across SEO, Google Ads, Meta Ads and analytics. Get a free certificate, scenario-based practice and 441 AI study prompts.',
  },
  '/blog': {
    title: 'Digital Marketing Blog — Guides & Insights | MySkills',
    description:
      'Practical guides on SEO, paid ads, analytics and content marketing, written for people building real marketing skills.',
  },
  '/login': {
    title: 'Sign in | MySkills',
    description: 'Sign in to your MySkills account to continue your assessment and practice.',
    noindex: true,
  },
  '/forgot-password': {
    title: 'Reset your password | MySkills',
    description: 'Request a link to reset your MySkills account password.',
    noindex: true,
  },
  '/reset-password': {
    title: 'Set a new password | MySkills',
    description: 'Set a new password for your MySkills account.',
    noindex: true,
  },
  '/signup': {
    title: 'Create your free account | MySkills',
    description:
      'Create a free MySkills account to take the digital marketing assessment and earn your certificate.',
  },
  '/become-a-mentor': {
    title: 'Become a mentor | MySkills',
    description:
      'Help students across India build real digital marketing skills. Apply to mentor on MySkills — no account needed, just a few minutes.',
  },
  '/community': {
    title: 'Community | MySkills',
    description:
      'Learn alongside people who’ve done it. Meet MySkills mentors, or apply to mentor students building real digital marketing skills.',
  },
}

/** Routes that belong in the sitemap, with their crawl hints. */
export const SITEMAP_ROUTES: { path: string; changefreq: string; priority: string }[] = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/signup', changefreq: 'monthly', priority: '0.8' },
  { path: '/blog', changefreq: 'daily', priority: '0.9' },
  { path: '/community', changefreq: 'weekly', priority: '0.7' },
  { path: '/become-a-mentor', changefreq: 'monthly', priority: '0.6' },
]

/** Absolute URL for a path. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

/* -- runtime DOM updates --------------------------------------------------- */

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * Apply metadata for the current page. Called on every navigation, because in
 * an SPA the document head persists across route changes.
 */
export function applySeo(path: string, override?: Partial<PageSeo>) {
  const base = PAGE_SEO[path]
  // Unlisted paths are signed-in app pages: title them, but keep them out of
  // the index.
  const seo: PageSeo = {
    title: base?.title ?? `${SITE_NAME} — Digital marketing skills`,
    description: base?.description ?? PAGE_SEO['/'].description,
    noindex: base ? base.noindex : true,
    ...override,
  }

  document.title = seo.title
  const url = absoluteUrl(path)
  const image = seo.image ?? DEFAULT_OG_IMAGE

  setMeta('meta[name="description"]', 'name', 'description', seo.description)
  setLink('canonical', url)

  setMeta('meta[property="og:title"]', 'property', 'og:title', seo.title)
  setMeta('meta[property="og:description"]', 'property', 'og:description', seo.description)
  setMeta('meta[property="og:url"]', 'property', 'og:url', url)
  setMeta('meta[property="og:image"]', 'property', 'og:image', image)
  setMeta('meta[property="og:type"]', 'property', 'og:type', override?.image ? 'article' : 'website')

  setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', seo.title)
  setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', seo.description)
  setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image)

  setMeta(
    'meta[name="robots"]',
    'name',
    'robots',
    seo.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
  )
}
