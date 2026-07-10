import type { FormEvent } from 'react'
import { useState } from 'react'
import { Mail, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { appConfig } from '@/lib/config'
import { supabase } from '@/services/supabase'

export function LoginPage() {
  const [mode, setMode] = useState<'magic' | 'password'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function submitMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
    setLoading(false)
    if (error) toast.error(error.message)
    else toast.success('Magic Link wurde versendet')
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) toast.error(error.message)
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background p-4 text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader><p className="text-xs uppercase tracking-[0.25em] text-primary">Feuerwehr</p><CardTitle className="text-3xl">{appConfig.name}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 rounded-xl bg-secondary p-1">
            <button type="button" onClick={() => setMode('password')} className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${mode === 'password' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>Passwort</button>
            <button type="button" onClick={() => setMode('magic')} className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${mode === 'magic' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>Magic Link</button>
          </div>
          {mode === 'password' ? (
            <form onSubmit={submitPassword} className="space-y-4">
              <p className="text-muted-foreground">Mit E-Mail und Passwort anmelden.</p>
              <Input type="email" required placeholder="name@feuerwehr.de" value={email} onChange={(event) => setEmail(event.target.value)} />
              <Input type="password" required placeholder="Passwort" value={password} onChange={(event) => setPassword(event.target.value)} />
              <Button className="w-full" size="lg" disabled={loading}><Lock className="h-5 w-5" /> Anmelden</Button>
            </form>
          ) : (
            <form onSubmit={submitMagicLink} className="space-y-4">
              <p className="text-muted-foreground">Mit Magic Link anmelden. Keine Passwörter, keine Hürden.</p>
              <Input type="email" required placeholder="name@feuerwehr.de" value={email} onChange={(event) => setEmail(event.target.value)} />
              <Button className="w-full" size="lg" disabled={loading}><Mail className="h-5 w-5" /> Link senden</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
