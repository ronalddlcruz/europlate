import { useEffect,useState } from 'react'
import { useLocation,useNavigate } from 'react-router-dom'
import { apiBaseUrl } from '../../../lib/api-client'
import { useAuth } from '../hooks/use-auth'

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
    void fetch(`${apiBaseUrl}/health`, { cache: 'no-store' }).catch(() => undefined)
  }, [])

  return { navigate, location, signIn, email, setEmail, password, setPassword, error, setError, loading, setLoading }
}
