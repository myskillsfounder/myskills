import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Profile } from './profile'
import {
  buildVerificationView,
  fetchMyVerification,
  NO_VERIFICATION,
  type VerificationRequest,
  type VerificationView,
  type VerifiedItem,
} from './verification'

export function useVerification(profile: Profile | null) {
  const [request, setRequest] = useState<VerificationRequest | null>(null)
  const [items, setItems] = useState<VerifiedItem[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const r = await fetchMyVerification()
    setRequest(r.request)
    setItems(r.items)
    setLoading(false)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const view: VerificationView = useMemo(
    () => (profile ? buildVerificationView(profile, items) : NO_VERIFICATION),
    [profile, items],
  )
  const hasOpenRequest = request?.status === 'requested' || request?.status === 'scheduled'

  return { request, items, view, hasOpenRequest, loading, reload }
}
