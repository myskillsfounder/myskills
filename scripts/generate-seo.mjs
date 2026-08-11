/**
 * Post-build SEO generation. Run automatically by `npm run build`.
 *
 * Emits into dist/:
 *   robots.txt                     — crawl rules + sitemap pointer
 *   sitemap.xml                    — static routes + every published blog post
 *   index.html                     — landing page, with real meta tags
 *   blog/index.html                — blog listing
 *   blog/<slug>/index.html         — one per post, with the article inlined
 *
 * WHY PRERENDER. The app is a client-rendered SPA: the shipped index.html is an
 * empty <div id="root">. Google can execute JS, but it's a slow second pass —
 * and Bing, LinkedIn, WhatsApp, Slack and most LLM crawlers don't run JS at
 * all. Blog posts are fetched from Supabase in the browser, so to those
 * crawlers every article is a blank page.
 *
 * This writes the title, description, canonical, Open Graph tags and the
 * article body straight into the HTML. React replaces the container contents
 * on mount, so users still get the SPA; crawlers get the content.
 *
 * No headless browser involved — this is string templating over the built
 * shell, which keeps it fast and dependency-free.
 *
 * Requires VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in the environment (the
 * same public values the app uses). If they're missing or the fetch fails, the
 * script still writes the static routes and warns — a broken build is worse
 * than a sitemap that's missing blog posts.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')

const SITE_URL = (process.env.VITE_SITE_URL ?? 'https://myskills.org.in').replace(/\/$/, '')
const SITE_NAME = 'MySkills'
const OG_IMAGE = `${SITE_URL}/og-image.png`

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL ?? 'https://supabase.myskills.org.in').replace(/\/$/, '')
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? ''

/* Keep in sync with PAGE_SEO / SITEMAP_ROUTES in src/lib/seo.ts. */
const STATIC_PAGES = [
  {
    path: '/',
    changefreq: 'weekly',
    priority: '1.0',
    title: 'Free Digital Marketing Skill Assessment & Certification | MySkills',
    description:
      'Test your digital marketing skills across SEO, Google Ads, Meta Ads and analytics. Get a free certificate, scenario-based practice and 441 AI study prompts.',
  },
  {
    path: '/signup',
    changefreq: 'monthly',
    priority: '0.8',
    title: 'Create your free account | MySkills',
    description:
      'Create a free MySkills account to take the digital marketing assessment and earn your certificate.',
  },
  {
    path: '/blog',
    changefreq: 'daily',
    priority: '0.9',
    title: 'Digital Marketing Blog — Guides & Insights | MySkills',
    description:
      'Practical guides on SEO, paid ads, analytics and content marketing, written for people building real marketing skills.',
  },
]

/** Signed-in app routes. Listed so the intent is explicit, never emitted. */
const PRIVATE_ROUTES = [
  '/dashboard', '/practice', '/profile', '/certificate', '/prompt-library',
  '/community', '/feedback', '/games', '/learning', '/internships',
  '/resources', '/tests', '/onboarding', '/assessment', '/login',
]

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/* -- data ------------------------------------------------------------------ */

async function fetchPosts() {
  if (!SUPABASE_ANON_KEY) {
    console.warn('[seo] VITE_SUPABASE_ANON_KEY not set — sitemap will omit blog posts.')
    return []
  }
  const url =
    `${SUPABASE_URL}/rest/v1/blog_posts` +
    `?select=slug,title,description,content,thumbnail_url,published_at,updated_at` +
    `&status=eq.published&order=published_at.desc`
  try {
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    })
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    return await res.json()
  } catch (err) {
    console.warn(`[seo] Could not fetch blog posts (${err.message}) — sitemap will omit them.`)
    return []
  }
}

/* -- sitemap + robots ------------------------------------------------------ */

function buildSitemap(posts) {
  const today = new Date().toISOString().slice(0, 10)

  const urls = [
    ...STATIC_PAGES.map(
      (p) => `  <url>
    <loc>${SITE_URL}${p.path === '/' ? '/' : p.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`,
    ),
    ...posts.map((p) => {
      const lastmod = (p.updated_at ?? p.published_at ?? '').slice(0, 10) || today
      return `  <url>
    <loc>${SITE_URL}/blog/${esc(p.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
    }),
  ]

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`
}

function buildRobots() {
  return `# ${SITE_NAME} — https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

# Signed-in app pages: nothing useful for a search visitor, and they'd hit a
# login wall. Kept out of the index so crawl budget goes to public content.
${PRIVATE_ROUTES.map((r) => `Disallow: ${r}`).join('\n')}

# Never index bare asset bundles.
Disallow: /assets/

Sitemap: ${SITE_URL}/sitemap.xml
`
}

/* -- prerendered HTML ------------------------------------------------------ */

/** Very small markdown -> HTML, enough for crawlers to read the article. */
function contentToHtml(md = '') {
  return md
    .split(/\n{2,}/)
    .map((block) => {
      const t = block.trim()
      if (!t) return ''
      const h = t.match(/^(#{1,4})\s+(.*)$/)
      if (h) {
        const lvl = Math.min(h[1].length + 1, 6)
        return `<h${lvl}>${esc(h[2])}</h${lvl}>`
      }
      if (/^[-*]\s+/m.test(t)) {
        const items = t
          .split('\n')
          .filter((l) => /^[-*]\s+/.test(l.trim()))
          .map((l) => `<li>${esc(l.trim().replace(/^[-*]\s+/, ''))}</li>`)
          .join('')
        return `<ul>${items}</ul>`
      }
      return `<p>${esc(t)}</p>`
    })
    .filter(Boolean)
    .join('\n')
}

function head({ title, description, url, image, type = 'website', jsonLd }) {
  return `    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${url}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${image}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${image}" />
${jsonLd ? `    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}`
}

/**
 * Swap the shell's head/body for page-specific content.
 *
 * The prerendered markup goes *inside* #root. React clears the container when
 * it mounts, so users see the real app and crawlers see the content — no
 * hidden text, no cloaking.
 */
function renderPage(shell, { headHtml, bodyHtml }) {
  let out = shell

  // Strip EVERY SEO tag the shell carries before injecting the page's own.
  // Without this the output ends up with two <title>s and two canonicals, and
  // a crawler is free to believe the wrong one — which would point every blog
  // post at the homepage.
  const strip = [
    /\n?[^\S\n]*<title>[\s\S]*?<\/title>/gi,
    /\n?[^\S\n]*<meta\s+name="description"[\s\S]*?\/?>/gi,
    /\n?[^\S\n]*<meta\s+name="robots"[\s\S]*?\/?>/gi,
    /\n?[^\S\n]*<link\s+rel="canonical"[\s\S]*?\/?>/gi,
    /\n?[^\S\n]*<meta\s+property="og:[\s\S]*?\/?>/gi,
    /\n?[^\S\n]*<meta\s+name="twitter:[\s\S]*?\/?>/gi,
  ]
  for (const re of strip) out = out.replace(re, '')

  // Also drop any HTML comments left dangling around the removed tags.
  out = out.replace(/\n?[^\S\n]*<!--[\s\S]*?-->/g, '')

  out = out.replace('</head>', `${headHtml}\n  </head>`)

  if (bodyHtml) {
    out = out.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`)
  }
  return out
}

function write(relPath, contents) {
  const full = join(DIST, relPath)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, contents, 'utf8')
}

/* -- main ------------------------------------------------------------------ */

async function main() {
  const shellPath = join(DIST, 'index.html')
  if (!existsSync(shellPath)) {
    console.error('[seo] dist/index.html not found — run vite build first.')
    process.exit(1)
  }
  const shell = readFileSync(shellPath, 'utf8')
  const posts = await fetchPosts()

  write('robots.txt', buildRobots())
  write('sitemap.xml', buildSitemap(posts))

  // Landing page: metadata + Organization/WebSite structured data.
  const home = STATIC_PAGES[0]
  write(
    'index.html',
    renderPage(shell, {
      headHtml: head({
        title: home.title,
        description: home.description,
        url: `${SITE_URL}/`,
        image: OG_IMAGE,
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'EducationalOrganization',
          name: SITE_NAME,
          url: SITE_URL,
          description: home.description,
          sameAs: [],
        },
      }),
    }),
  )

  const blog = STATIC_PAGES[2]
  write(
    'blog/index.html',
    renderPage(shell, {
      headHtml: head({
        title: blog.title,
        description: blog.description,
        url: `${SITE_URL}/blog`,
        image: OG_IMAGE,
      }),
      bodyHtml: posts.length
        ? `<main><h1>${esc(blog.title)}</h1><ul>${posts
            .map(
              (p) =>
                `<li><a href="/blog/${esc(p.slug)}">${esc(p.title)}</a> — ${esc(p.description)}</li>`,
            )
            .join('')}</ul></main>`
        : '',
    }),
  )

  for (const p of posts) {
    const url = `${SITE_URL}/blog/${p.slug}`
    write(
      `blog/${p.slug}/index.html`,
      renderPage(shell, {
        headHtml: head({
          title: `${p.title} | ${SITE_NAME}`,
          description: p.description,
          url,
          image: p.thumbnail_url || OG_IMAGE,
          type: 'article',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: p.title,
            description: p.description,
            image: p.thumbnail_url || OG_IMAGE,
            datePublished: p.published_at,
            dateModified: p.updated_at ?? p.published_at,
            mainEntityOfPage: url,
            publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
          },
        }),
        bodyHtml: `<article><h1>${esc(p.title)}</h1><p>${esc(p.description)}</p>${contentToHtml(
          p.content,
        )}</article>`,
      }),
    )
  }

  console.log(
    `[seo] wrote robots.txt, sitemap.xml (${STATIC_PAGES.length + posts.length} urls), ` +
      `and ${posts.length + 2} prerendered pages -> ${SITE_URL}`,
  )
}

main()
