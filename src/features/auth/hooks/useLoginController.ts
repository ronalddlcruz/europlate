import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiClient } from '@/lib/api-client'
import { PATHS } from '@/app/router/constants/paths'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { loginInputSchema } from '@/features/auth/schemas/auth.schema'

export function useLoginController() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    // Despierta la API mientras el usuario completa el formulario. No bloquea
    // el login ni muestra errores si Render está arrancando tras inactividad.
    void apiClient.warmUp().catch(() => undefined)
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const credentials = loginInputSchema.safeParse({ email, password })
    if (!credentials.success) {
      setError(credentials.error.issues[0]?.message ?? 'Revisa tus datos de acceso.')
      return
    }

    setLoading(true)
    try {
      await signIn(credentials.data.email, credentials.data.password)
      navigate((location.state as { from?: string } | null)?.from ?? PATHS.APP.DASHBOARD, {
        replace: true,
      })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return { email, setEmail, password, setPassword, error, loading, submit }
}
