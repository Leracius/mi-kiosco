import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { createCatalogRepository } from '../catalog/catalogRepository'

function openRepository() {
  try {
    return createCatalogRepository({
      url: import.meta.env.VITE_SUPABASE_URL,
      key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    }, undefined, true)
  } catch {
    return null
  }
}

export function useAdmin() {
  const [repository] = useState(openRepository)
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(!repository)

  useEffect(() => {
    if (!repository) return
    const { data } = repository.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setReady(true)
    })
    return () => data.subscription.unsubscribe()
  }, [repository])

  return { repository, session, ready, isAdmin: session?.user.app_metadata.kiosk_admin === true }
}
