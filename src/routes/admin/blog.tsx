import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, FileText, Plus, Trash2 } from 'lucide-react'
import {
  deletePost,
  fetchAllPosts,
  savePost,
  slugify,
  type BlogPostInput,
} from '@/lib/admin'
import type { BlogPost } from '@/lib/blog'
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Input,
  PageHeader,
  Skeleton,
  Textarea,
} from '@/components/ui'

export const Route = createFileRoute('/admin/blog')({
  component: BlogAdminPage,
})

const EMPTY: BlogPostInput = {
  title: '',
  slug: '',
  description: '',
  content: '',
  thumbnail_url: null,
  status: 'draft',
}

function Editor({
  initial,
  onCancel,
  onSaved,
}: {
  initial: BlogPostInput
  onCancel: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()
  // Once a post is live its slug is a public URL; changing it silently breaks
  // every existing link, so it only auto-follows the title for new drafts.
  const [slugLocked] = useState(Boolean(initial.id))

  function setTitle(title: string) {
    setForm((f) => ({ ...f, title, slug: slugLocked ? f.slug : slugify(title) }))
  }

  async function save(status: 'draft' | 'published') {
    if (!form.title.trim()) return setError('A title is required.')
    if (!form.slug.trim()) return setError('A slug is required.')

    setSaving(true)
    setError(undefined)
    try {
      await savePost({ ...form, status })
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card space-y-5 p-6">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900"
      >
        <ArrowLeft size={16} /> Back to posts
      </button>

      <Input label="Title" value={form.title} onChange={(e) => setTitle(e.target.value)} />

      <Input
        label="Slug"
        value={form.slug}
        onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
        hint={
          slugLocked
            ? 'This post already exists — changing the slug breaks its published URL.'
            : `/blog/${form.slug || '…'}`
        }
      />

      <Textarea
        label="Description"
        rows={2}
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        hint="Used as the search-result and link-preview summary."
      />

      <Input
        label="Thumbnail URL"
        required={false}
        value={form.thumbnail_url ?? ''}
        onChange={(e) => setForm((f) => ({ ...f, thumbnail_url: e.target.value }))}
      />

      <Textarea
        label="Content"
        rows={16}
        value={form.content}
        onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
        hint="HTML — it's injected directly into the page, so only paste markup you trust."
        className="font-mono text-xs"
      />

      {error && (
        <Alert tone="danger" title="Couldn’t save">
          <p>{error}</p>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void save('published')} disabled={saving}>
          {saving ? 'Saving…' : 'Publish'}
        </Button>
        <Button variant="secondary" onClick={() => void save('draft')} disabled={saving}>
          Save as draft
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

function BlogAdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [editing, setEditing] = useState<BlogPostInput | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string>()

  async function load() {
    setLoading(true)
    setError(undefined)
    try {
      setPosts(await fetchAllPosts())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function remove(id: string) {
    try {
      await deletePost(id)
      setConfirmDelete(undefined)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  if (editing) {
    return (
      <Editor
        initial={editing}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          void load()
        }}
      />
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Blog"
        subtitle="Write, publish and edit posts."
        actions={
          <Button icon={Plus} onClick={() => setEditing({ ...EMPTY })}>
            New post
          </Button>
        }
      />

      {error && (
        <div className="mb-5">
          <Alert tone="danger" title="Something went wrong">
            <p>{error}</p>
          </Alert>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No posts yet"
          description="Write your first post to start bringing in organic traffic."
          action={
            <Button icon={Plus} onClick={() => setEditing({ ...EMPTY })}>
              New post
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <article key={p.id} className="card flex flex-wrap items-center gap-4 p-4">
              {p.thumbnail_url ? (
                <img
                  src={p.thumbnail_url}
                  alt=""
                  className="h-14 w-20 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <span className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-400">
                  <FileText size={18} />
                </span>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate font-medium text-ink-900">{p.title}</h2>
                  <Badge tone={p.status === 'published' ? 'success' : 'neutral'}>{p.status}</Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-ink-500">/blog/{p.slug}</p>
              </div>

              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setEditing({
                      id: p.id,
                      title: p.title,
                      slug: p.slug,
                      description: p.description,
                      content: p.content,
                      thumbnail_url: p.thumbnail_url,
                      status: p.status,
                    })
                  }
                >
                  Edit
                </Button>
                {confirmDelete === p.id ? (
                  <>
                    <Button size="sm" variant="danger" onClick={() => void remove(p.id)}>
                      Confirm
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(undefined)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={Trash2}
                    onClick={() => setConfirmDelete(p.id)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
