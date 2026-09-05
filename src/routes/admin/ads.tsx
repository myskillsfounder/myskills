import { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, Megaphone, Plus, Trash2, Upload } from 'lucide-react'
import {
  deleteAd,
  fetchAllAds,
  saveAd,
  uploadAdImage,
  type AdInput,
  type AdminAd,
} from '@/lib/admin'
import { Alert, Badge, Button, EmptyState, Input, PageHeader, Skeleton } from '@/components/ui'

export const Route = createFileRoute('/admin/ads')({
  component: AdsAdminPage,
})

const EMPTY: AdInput = {
  title: '',
  image_url: '',
  image_path: '',
  link_url: '',
  active: true,
  sort_order: 0,
}

function Editor({
  initial,
  onCancel,
  onSaved,
}: {
  initial: AdInput
  onCancel: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string>()
  const fileRef = useRef<HTMLInputElement>(null)

  async function pickImage(file: File) {
    setUploading(true)
    setError(undefined)
    try {
      const { url, path } = await uploadAdImage(file)
      setForm((f) => ({ ...f, image_url: url, image_path: path }))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    if (!form.image_url.trim()) return setError('An image is required.')

    setSaving(true)
    setError(undefined)
    try {
      await saveAd(form)
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
        <ArrowLeft size={16} /> Back to ads
      </button>

      <div>
        <p className="mb-1.5 block text-sm font-medium text-ink-800">Image</p>
        {form.image_url ? (
          <img
            src={form.image_url}
            alt=""
            className="mb-3 max-h-48 w-full rounded-xl border border-ink-200 object-contain"
          />
        ) : (
          <div className="mb-3 flex h-32 items-center justify-center rounded-xl border border-dashed border-ink-300 text-sm text-ink-500">
            No image yet
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void pickImage(file)
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={Upload}
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? 'Uploading…' : form.image_url ? 'Replace image' : 'Upload image'}
        </Button>
      </div>

      <Input
        label="Title"
        required={false}
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        hint="Internal label — helps you tell ads apart."
      />

      <Input
        label="Link URL"
        required={false}
        type="url"
        value={form.link_url}
        onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
        placeholder="https://example.com/offer"
        hint="Where the ad goes when clicked. Leave blank for a non-clickable ad."
      />

      <Input
        label="Sort order"
        type="number"
        value={String(form.sort_order)}
        onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))}
        hint="Lower numbers show first."
      />

      <label className="flex items-center gap-2.5">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
          className="h-4 w-4 accent-brand-600"
        />
        <span className="text-sm text-ink-800">
          Active — inactive ads stay saved but aren’t shown to users.
        </span>
      </label>

      {error && (
        <Alert tone="danger" title="Couldn’t save">
          <p>{error}</p>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button onClick={() => void save()} disabled={saving || uploading}>
          {saving ? 'Saving…' : 'Save ad'}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

function AdsAdminPage() {
  const [ads, setAds] = useState<AdminAd[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [editing, setEditing] = useState<AdInput | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string>()

  async function load() {
    setLoading(true)
    setError(undefined)
    try {
      setAds(await fetchAllAds())
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
      await deleteAd(id)
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
        title="Ads"
        subtitle="Shown in the sidebar slider. Inactive ads stay saved but hidden."
        actions={
          <Button icon={Plus} onClick={() => setEditing({ ...EMPTY })}>
            New ad
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
        <Skeleton className="h-56 w-full" />
      ) : ads.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No ads yet"
          description="Add one to start showing promotions in the sidebar."
          action={
            <Button icon={Plus} onClick={() => setEditing({ ...EMPTY })}>
              New ad
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {ads.map((ad) => (
            <article key={ad.id} className="card overflow-hidden">
              <img src={ad.image_url} alt="" className="h-36 w-full bg-ink-100 object-contain" />
              <div className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="min-w-0 truncate font-medium text-ink-900">
                    {ad.title || 'Untitled ad'}
                  </p>
                  <Badge tone={ad.active ? 'success' : 'neutral'}>
                    {ad.active ? 'Active' : 'Hidden'}
                  </Badge>
                </div>
                {ad.link_url && (
                  <p className="mt-0.5 truncate text-xs text-ink-500">{ad.link_url}</p>
                )}
                <p className="mt-0.5 text-xs text-ink-500">Order {ad.sort_order}</p>

                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setEditing({
                        id: ad.id,
                        title: ad.title ?? '',
                        image_url: ad.image_url,
                        image_path: ad.image_path,
                        link_url: ad.link_url ?? '',
                        active: ad.active,
                        sort_order: ad.sort_order,
                      })
                    }
                  >
                    Edit
                  </Button>
                  {confirmDelete === ad.id ? (
                    <>
                      <Button size="sm" variant="danger" onClick={() => void remove(ad.id)}>
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
                      onClick={() => setConfirmDelete(ad.id)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
