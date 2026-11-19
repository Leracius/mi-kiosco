import { useRef, useState, type FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

type Auth = SupabaseClient['auth']

export function AdminAccess({ auth, ready, signedIn, isAdmin }: {
  auth?: Auth
  ready: boolean
  signedIn: boolean
  isAdmin: boolean
}) {
  const inFlight = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function act(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!auth || inFlight.current) return
    const fields = new FormData(event.currentTarget)
    inFlight.current = true
    setBusy(true)
    setError('')
    try {
      const result = signedIn ? await auth.signOut({ scope: 'local' }) : await auth.signInWithPassword({
        email: String(fields.get('email')).trim(),
        password: String(fields.get('password')),
      })
      if (result.error) throw result.error
    } catch {
      setError(signedIn ? 'No pudimos cerrar sesión.' : 'No pudimos iniciar sesión. Revisá tus datos y la conexión.')
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  if (!ready) return <p className="empty" role="status">Verificando sesión…</p>
  if (!auth) return <p className="empty">Configurá Supabase para iniciar sesión.</p>
  return (
    <form className="new-product admin-access" onSubmit={act}>
      {signedIn ? (
        <p>{isAdmin ? 'Sesión de administración activa.' : 'Esta cuenta no tiene permiso para administrar el catálogo.'}</p>
      ) : (
        <>
          <label className="field">Correo electrónico<input name="email" type="email" autoComplete="username" required /></label>
          <label className="field">Contraseña<input name="password" type="password" autoComplete="current-password" required /></label>
        </>
      )}
      {error && <p className="field-error" role="alert">{error}</p>}
      <button className="button primary" disabled={busy}>{signedIn ? 'Cerrar sesión' : 'Iniciar sesión'}</button>
    </form>
  )
}
