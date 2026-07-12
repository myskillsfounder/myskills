import { useCallback, useEffect, useState } from 'react'
import {
  fetchMyProfile,
  saveMyProfile,
  uploadProfileMedia,
  type Profile,
  type ProfilePatch,
} from './profile'

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    fetchMyProfile()
      .then(setProfile)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [])

  const save = useCallback(async (patch: ProfilePatch) => {
    const updated = await saveMyProfile(patch)
    setProfile(updated)
    return updated
  }, [])

  const upload = useCallback(
    (file: File, kind: 'avatar' | 'banner') => uploadProfileMedia(file, kind),
    [],
  )

  return { profile, loading, error, save, upload }
}
