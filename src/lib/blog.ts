/**
 * Public blog reads. Only PUBLISHED posts are visible to anon (enforced by RLS
 * on blog_posts), so these queries are safe to run from the marketing site.
 * Posts are authored in the separate blog-admin app.
 */
import { supabase } from './supabase'

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
