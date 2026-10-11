import { LoginForm } from '@/features/auth/components/login-form'
import { useLoginController } from '@/features/auth/hooks/useLoginController'

export function LoginPage() {
  const form = useLoginController()
  return <LoginForm {...form} />
}
