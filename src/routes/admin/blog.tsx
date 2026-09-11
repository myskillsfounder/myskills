import { useEffect, useRef, useState } from 'react'
import { errorMessage } from '@/lib/errors'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, FileText, ImageOff, Plus, Trash2, Upload } from 'lucide-react'
import {
  deletePost,
  fetchAllPosts,
  savePost,
  slugify,
  uploadBlogThumbnail,
  type BlogPostInput,
} from '@/lib/admin'
import type { BlogPost } from '@/lib/blog'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
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
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string>()
  const fileRef = useRef<HTMLInputElement>(null)
  // Once a post is live its slug is a public URL; changing it silently breaks
  // every existing link, so it only auto-follows the title for new drafts.
  const [slugLocked] = useState(Boolean(initial.id))

  function setTitle(title: string) {
    setForm((f) => ({ ...f, title, slug: slugLocked ? f.slug : slugify(title) }))
  }

  async function pickThumbnail(file: File) {
    setUploading(true)
    setError(undefined)
    try {
      const url = await uploadBlogThumbnail(file)
      setForm((f) => ({ ...f, thumbnail_url: url }))
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setUploading(false)
    }
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
      setError(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900"
      >
        <ArrowLeft size={16} /> Back to posts
      </button>

      <div className="card space-y-5 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
          Post details
        </p>

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
      </div>

      <div className="card space-y-3 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Thumbnail</p>

        {form.thumbnail_url ? (
          <img
            src={form.thumbnail_url}
            alt=""
            className="aspect-video w-full max-w-sm rounded-xl border border-ink-200 object-cover"
            onError={() => setForm((f) => ({ ...f, thumbnail_url: null }))}
          />
        ) : (
          <div className="flex aspect-video w-full max-w-sm flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink-300 text-ink-400">
            <ImageOff size={22} />
            <span className="text-sm">No thumbnail yet</span>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void pickThumbnail(file)
          }}
        />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={Upload}
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? 'Uploading…' : form.thumbnail_url ? 'Replace thumbnail' : 'Upload thumbnail'}
          </Button>
          {form.thumbnail_url && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={uploading}
              onClick={() => setForm((f) => ({ ...f, thumbnail_url: null }))}
            >
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-ink-500">
          Shown on the blog listing and as the link-preview image. 16:9 images look best.
        </p>
      </div>

      <div className="card space-y-3 p-6">
        <RichTextEditor
          label="Content"
          value={form.content}
          onChange={(html) => setForm((f) => ({ ...f, content: html }))}
          hint="Formats as real HTML — sanitized again before it's ever shown to a reader, so pasted content can't sneak in anything unsafe."
        />
      </div>

      {error && (
        <Alert tone="danger" title="Couldn’t save">
          <p>{error}</p>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void save('published')} disabled={saving || uploading}>
          {saving ? 'Saving…' : 'Publish'}
        </Button>
        <Button variant="secondary" onClick={() => void save('draft')} disabled={saving || uploading}>
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
      setError(errorMessage(e))
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
      setError(errorMessage(e))
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
              <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                {p.thumbnail_url && (
                  <img
                    src={p.thumbnail_url}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                )}
                <span
                  className={`flex h-full w-full items-center justify-center text-ink-400 ${p.thumbnail_url ? 'hidden' : ''}`}
                >
                  <FileText size={18} />
                </span>
              </div>

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
