import { Link, NavLink, Outlet } from 'react-router-dom'
import { BarChart3, Beer, Home, KeyRound, Settings, WifiOff } from 'lucide-react'
import { Toaster } from 'sonner'
import { appConfig } from '@/lib/config'
import { useAuth } from '@/hooks/useAuth'
import { useOfflineSync } from '@/features/offline/useOfflineSync'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/', label: 'Kasse', icon: Home },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/lager', label: 'Lager', icon: Beer },
  { href: '/admin', label: 'Admin', icon: Settings },
]

export function Layout() {
  const { pending, isOnline } = useOfflineSync()
  const { session } = useAuth()
  const mustChangePassword = Boolean(session?.user.user_metadata?.must_change_password)
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-primary">Feuerwehr</p>
            <h1 className="text-xl font-black tracking-tight">{appConfig.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs text-muted-foreground">
              {!isOnline && <WifiOff className="h-4 w-4 text-amber-400" />}
              {pending > 0 ? `${pending} offline` : isOnline ? 'Online' : 'Offline'}
            </div>
            <Link to="/konto" title="Konto & Passwort" className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground"><KeyRound className="h-4 w-4" /></Link>
          </div>
        </div>
        {mustChangePassword && (
          <div className="border-t border-amber-500/40 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-300">
            Bitte <Link to="/konto" className="font-semibold underline">Passwort jetzt ändern</Link> – ein Admin hat dir ein Startpasswort vergeben.
          </div>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-4 sm:pb-8"><Outlet /></main>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-slate-950/95 p-2 backdrop-blur sm:hidden">
        <div className="grid grid-cols-4 gap-1">
          {nav.map((item) => (
            <NavLink key={item.href} to={item.href} className={({ isActive }) => cn('flex min-h-16 flex-col items-center justify-center rounded-xl text-xs font-semibold text-muted-foreground', isActive && 'bg-secondary text-foreground')}>
              <item.icon className="mb-1 h-5 w-5" />{item.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <aside className="fixed left-4 top-28 hidden w-20 flex-col gap-2 sm:flex">
        {nav.map((item) => (
          <NavLink key={item.href} to={item.href} className={({ isActive }) => cn('flex h-16 flex-col items-center justify-center rounded-2xl border border-border bg-card text-xs text-muted-foreground', isActive && 'border-primary/60 text-foreground shadow-glow')}>
            <item.icon className="mb-1 h-5 w-5" />{item.label}
          </NavLink>
        ))}
      </aside>
      <Toaster richColors theme="dark" position="top-center" />
    </div>
  )
}
