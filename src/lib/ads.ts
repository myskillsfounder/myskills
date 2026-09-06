/**
 * Public reads for the sidebar advertising slider. RLS on `ads` only exposes
 * ACTIVE rows to the anon key, so this is safe to run from the app. Ads are
 * managed at /admin/ads (see src/lib/admin.ts) — the browser never writes
 * here directly.
 */
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export interface Ad {
  id: string
  title: string | null
  image_url: string
  link_url: string | null
  sort_order: number
}

/** Active ads, in slider order. */
export async function fetchActiveAds(): Promise<Ad[]> {
  const { data, error } = await supabase
    .from('ads')
    .select('id, title, image_url, link_url, sort_order')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Ad[]
}

/** Small hook for the sidebar slider. Fails silent (empty list) — an ad fetch
 * error should never break the app shell. */
export function useActiveAds(): Ad[] {
  const [ads, setAds] = useState<Ad[]>([])
  useEffect(() => {
    let alive = true
    fetchActiveAds()
      .then((rows) => {
        if (alive) setAds(rows)
      })
      .catch(() => {
        if (alive) setAds([])
      })
    return () => {
      alive = false
    }
  }, [])
  return ads
}
