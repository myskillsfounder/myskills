import { useEffect, useState } from 'react'
import { errorMessage } from '@/lib/errors'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { fetchPublishedPosts, formatDate, type BlogPostSummary } from '@/lib/blog'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Eyebrow } from '@/components/landing/Eyebrow'
import { BlogHero } from '@/components/blog/BlogHero'
import { BlogImage } from '@/components/blog/BlogImage'

export const Route = createFileRoute('/blog/')({
  component: BlogIndexPage,
})

/** Card-shaped placeholders while the posts load, so the page keeps its shape
 *  instead of jumping when they arrive. */
function CardSkeletons() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="card-glass-dark overflow-hidden">
          <div className="aspect-video w-full animate-pulse bg-white/[0.06]" />
          <div className="space-y-2.5 p-5">
            <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-full animate-pulse rounded bg-white/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  )
}

function BlogIndexPage() {
  const [posts, setPosts] = useState<BlogPostSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    fetchPublishedPosts()
      .then(setPosts)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  const [lead, ...rest] = posts

  return (
    <div className="min-h-screen bg-ink-900">
      <Navbar />
      <main>
        <BlogHero>
          <div className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:px-6 sm:pt-16 lg:px-8">
            <Eyebrow dark>The MySkills blog</Eyebrow>
            <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl">
              Guides and playbooks for building real skills
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/70">
              Practical writing on digital marketing, careers and learning with AI, from the MySkills team.
            </p>
          </div>

          <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
            {loading && <CardSkeletons />}

            {error && (
              <div className="card-glass-dark p-5 text-sm text-red-200">Couldn’t load posts. {error}</div>
            )}

            {!loading && !error && posts.length === 0 && (
              <div className="card-glass-dark p-12 text-center">
                <p className="text-sm font-medium text-white">No posts yet</p>
                <p className="mt-1 text-sm text-white/60">Check back soon.</p>
              </div>
            )}

            {/* The newest post leads, full width; the rest follow as cards. */}
            {lead && (
              <Link
                to="/blog/$slug"
                params={{ slug: lead.slug }}
                className="card-glass-dark group grid overflow-hidden transition-colors hover:border-brand-300/40 md:grid-cols-2"
              >
                <BlogImage
                  url={lead.thumbnail_url}
                  width={1200}
                  eager
                  className="aspect-video w-full self-center object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
                <div className="flex flex-col justify-center p-6 sm:p-8">
                  <p className="font-mono text-xs text-brand-200">Latest · {formatDate(lead.published_at)}</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold leading-snug text-white sm:text-3xl">
                    {lead.title}
                  </h2>
                  <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-white/70">{lead.description}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                    Read the article
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            )}

            {rest.length > 0 && (
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <Link
                    key={post.id}
                    to="/blog/$slug"
                    params={{ slug: post.slug }}
                    className="card-glass-dark group flex flex-col overflow-hidden transition-colors hover:border-brand-300/40"
                  >
                    <div className="aspect-video w-full overflow-hidden">
                      <BlogImage
                        url={post.thumbnail_url}
                        width={800}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <p className="font-mono text-[11px] text-white/50">{formatDate(post.published_at)}</p>
                      <h2 className="mt-1.5 font-display text-lg font-semibold leading-snug text-white">
                        {post.title}
                      </h2>
                      <p className="mt-1.5 line-clamp-3 flex-1 text-sm leading-relaxed text-white/65">
                        {post.description}
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-200">
                        Read more
                        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </BlogHero>
      </main>
      <Footer />
    </div>
  )
}
