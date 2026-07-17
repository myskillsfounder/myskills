import { useEffect, useState } from 'react'
import { createFileRoute, Link, useParams } from '@tanstack/react-router'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { fetchPostBySlug, formatDate, type BlogPost } from '@/lib/blog'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

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
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [slug])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
        >
          <ArrowLeft size={16} />
          All posts
        </Link>

        {loading && (
          <div className="flex items-center gap-2 py-16 text-sm text-ink-500">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error}
          </div>
        )}

        {notFound && !loading && (
          <div className="mt-10 rounded-2xl border border-dashed border-ink-200 p-12 text-center">
            <p className="text-sm font-medium text-ink-700">Post not found</p>
            <p className="mt-1 text-sm text-ink-500">It may have been unpublished or removed.</p>
          </div>
        )}

        {post && (
          <article className="mt-6">
            <p className="text-sm text-ink-400">{formatDate(post.published_at)}</p>
            <h1 className="mt-1.5 text-3xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-4xl">
              {post.title}
            </h1>
            {post.description && (
              <p className="mt-3 text-lg text-ink-500">{post.description}</p>
            )}
            {post.thumbnail_url && (
              <img
                src={post.thumbnail_url}
                alt=""
                className="mt-6 aspect-video w-full rounded-2xl object-cover"
              />
            )}
            {/* Content is authored in the trusted admin panel. */}
            <div
              className="blog-content mt-8"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>
        )}
      </main>
      <Footer />
    </div>
  )
}
