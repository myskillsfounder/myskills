import { useEffect, useState } from 'react'
import { errorMessage } from '@/lib/errors'
import { createFileRoute, Link, useParams } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { fetchPostBySlug, formatDate, sanitizeBlogHtml, type BlogPost } from '@/lib/blog'
import { applySeo } from '@/lib/seo'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { Eyebrow } from '@/components/landing/Eyebrow'
import { BlogHero } from '@/components/blog/BlogHero'
import { BlogImage } from '@/components/blog/BlogImage'

export const Route = createFileRoute('/blog/$slug')({
  component: BlogPostPage,
})

function BlogPostPage() {
  const { slug } = useParams({ from: '/blog/$slug' })
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    fetchPostBySlug(slug)
      .then((p) => {
        if (!p) setNotFound(true)
        else setPost(p)
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false))
  }, [slug])

  // Per-post metadata once the post resolves. The prerendered HTML already
  // carries these tags for crawlers; this keeps them right for client-side
  // navigation (and for the share sheet on mobile).
  useEffect(() => {
    if (!post) return
    applySeo(`/blog/${post.slug}`, {
      title: `${post.title} | MySkills`,
      description: post.description,
      image: post.thumbnail_url ?? undefined,
      noindex: false,
    })
  }, [post])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <BlogHero>
          <div className="mx-auto max-w-3xl px-4 pb-12 pt-10 sm:px-6 sm:pb-14 sm:pt-12">
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white/65 transition-colors hover:text-white"
            >
              <ArrowLeft size={16} />
              All posts
            </Link>

            {loading && (
              <div className="mt-8 space-y-3" aria-hidden>
                <div className="h-3 w-28 animate-pulse rounded bg-white/10" />
                <div className="h-9 w-4/5 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-3/5 animate-pulse rounded bg-white/[0.06]" />
              </div>
            )}

            {error && <div className="card-glass-dark mt-6 p-5 text-sm text-red-200">{error}</div>}

            {notFound && !loading && (
              <div className="card-glass-dark mt-8 p-10 text-center">
                <p className="text-sm font-medium text-white">Post not found</p>
                <p className="mt-1 text-sm text-white/60">It may have been unpublished or removed.</p>
              </div>
            )}

            {post && (
              <header className="mt-6">
                <Eyebrow dark>{formatDate(post.published_at)}</Eyebrow>
                <h1 className="mt-3 font-display text-3xl font-semibold leading-[1.15] tracking-tight text-white sm:text-[2.6rem]">
                  {post.title}
                </h1>
                {post.description && (
                  <p className="mt-3.5 text-lg leading-relaxed text-white/70">{post.description}</p>
                )}
              </header>
            )}
          </div>
        </BlogHero>

        {/* The article itself stays on a light page: long-form reading is easier
            dark-on-light, and the body styles (.blog-content) are written for it. */}
        {post && (
          <article className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
            {post.thumbnail_url && (
              <div className="-mt-6 overflow-hidden rounded-2xl shadow-e2 ring-1 ring-ink-900/[0.06]">
                <BlogImage url={post.thumbnail_url} width={1400} eager className="aspect-video w-full object-cover" />
              </div>
            )}
            {/* Content is authored in the trusted admin panel, but still
                sanitized before injection — see lib/blog.ts. */}
            <div
              className="blog-content mt-8"
              dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(post.content) }}
            />
            <Link
              to="/blog"
              className="mt-10 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              <ArrowLeft size={16} />
              More from the blog
            </Link>
          </article>
        )}
      </main>
      <Footer />
    </div>
  )
}
