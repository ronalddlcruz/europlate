import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LockKeyhole, Mail } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { login } from '../services/auth.service'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@europlate.pe')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  return <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#e8f0fe_0%,#f0f4f9_60%,#fef3e2_100%)] p-5">
    <form className="w-full max-w-[420px] rounded-2xl border border-border bg-white p-8 shadow-panel sm:p-12" onSubmit={async (event) => { event.preventDefault(); setError(''); setLoading(true); try { await login(email, password); navigate('/dashboard') } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo iniciar sesión.') } finally { setLoading(false) } }}>
      <div className="mb-8"><h1 className="font-mono text-[22px] font-bold tracking-tight text-brand">EUROPLATE</h1><p className="mt-1 text-[13px] text-muted">Sistema de Gestión Comercial</p></div>
      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[.5px] text-slate-600">Correo electrónico</label>
      <div className="relative mb-5"><Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input className="pl-9" type="email" placeholder="admin@europlate.pe" value={email} onChange={event => setEmail(event.target.value)} required /></div>
      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[.5px] text-slate-600">Contraseña</label>
      <div className="relative mb-4"><LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input className="pl-9" type="password" placeholder="••••••••" value={password} onChange={event => setPassword(event.target.value)} required /></div>
      {error && <p className="mb-4 text-xs text-red-600">{error}</p>}
      <Button className="w-full" type="submit" disabled={loading}>{loading ? 'Ingresando…' : 'Ingresar al sistema'}</Button>
    </form>
  </main>
}
