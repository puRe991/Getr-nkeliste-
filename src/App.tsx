import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { AuthGate } from '@/components/AuthGate'
import type { ReactNode } from 'react'

const KassePage = lazy(() => import('@/pages/KassePage').then((module) => ({ default: module.KassePage })))
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const InventoryPage = lazy(() => import('@/pages/InventoryPage').then((module) => ({ default: module.InventoryPage })))
const AdminPage = lazy(() => import('@/pages/AdminPage').then((module) => ({ default: module.AdminPage })))

const router = createBrowserRouter([
  { path: '/', element: <AuthGate><Layout /></AuthGate>, children: [
    { index: true, element: <Page><KassePage /></Page> },
    { path: 'dashboard', element: <Page><DashboardPage /></Page> },
    { path: 'lager', element: <Page><InventoryPage /></Page> },
    { path: 'admin', element: <Page><AdminPage /></Page> },
  ] },
])

function Page({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Lade Ansicht…</div>}>{children}</Suspense>
}

export function App() { return <RouterProvider router={router} /> }
