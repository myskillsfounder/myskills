import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Loader2 } from 'lucide-react'
import { fetchPublishedPosts, formatDate, type BlogPost } from '@/lib/blog'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'

export const Route = createFileRoute('/blog/')({
  component: BlogIndexPage,
})

function BlogIndexPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    fetchPublishedPosts()
      .then(setPosts)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">Blog</h1>
          <p className="mt-2 max-w-2xl text-ink-600">
            Guides, playbooks, and insights on digital marketing from the MySkills team.
          </p>
        </header>

        {loading && (
          <div className="flex items-center gap-2 py-16 text-sm text-ink-600">
            <Loader2 size={16} className="animate-spin" /> Loading posts…
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            Couldn’t load posts. {error}
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-ink-300 p-12 text-center">
            <p className="text-sm font-medium text-ink-800">No posts yet</p>
            <p className="mt-1 text-sm text-ink-600">Check back soon.</p>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              to="/blog/$slug"
              params={{ slug: post.slug }}
              className="group flex flex-col card overflow-hidden transition-colors hover:border-brand-200"
            >
              <div className="aspect-video w-full overflow-hidden bg-ink-200">
                {post.thumbnail_url ? (
                  <img
                    src={post.thumbnail_url}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-brand-50 to-ink-100" />
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs text-ink-500">{formatDate(post.published_at)}</p>
                <h2 className="mt-1.5 text-base font-semibold leading-snug text-ink-900">
                  {post.title}
                </h2>
                <p className="mt-1.5 line-clamp-3 flex-1 text-sm text-ink-600">{post.description}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600">
                  Read more
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
