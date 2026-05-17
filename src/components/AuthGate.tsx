import type { ReactNode } from 'react'
import { LoginPage } from '@/pages/LoginPage'
import { useAuth } from '@/hooks/useAuth'
import { isSupabaseConfigured } from '@/services/supabase'

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  if (!isSupabaseConfigured) return children
  if (loading) return <div className="grid min-h-screen place-items-center bg-background text-muted-foreground">Prüfe Anmeldung…</div>
  if (!session) return <LoginPage />
  return children
}
