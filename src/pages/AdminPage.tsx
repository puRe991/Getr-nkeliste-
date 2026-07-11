import { useMemo, useState } from 'react'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarClock, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { UserCreateForm, DrinkCreateForm } from '@/features/admin/AdminForms'
import { CsvExport } from '@/features/admin/CsvExport'
import { UserQrCode } from '@/features/qr/UserQrCode'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useDrinks, useTransactions, useUsers } from '@/hooks/useAppData'
import { formatCurrency } from '@/lib/utils'
import { balanceAdjustmentSchema } from '@/lib/validations'
import { adjustBalance, updateUser } from '@/services/api'
import type { AppUser, Transaction } from '@/types/database'

const userColumns = createColumnHelper<AppUser>()

export function AdminPage() {
  const [from, setFrom] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10))
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))
  const users = useUsers()
  const drinks = useDrinks()
  const transactions = useTransactions(`${from}T00:00:00.000Z`, `${to}T23:59:59.999Z`)
  const userData = users.data ?? []

  const columns = useMemo(() => [
    userColumns.accessor('name', { header: 'Name' }),
    userColumns.accessor('role', { header: 'Rolle', cell: (info) => <Badge>{info.getValue()}</Badge> }),
    userColumns.accessor('balance', { header: 'Kontostand', cell: (info) => formatCurrency(info.getValue()) }),
    userColumns.display({ id: 'adjust', header: 'Guthaben anpassen', cell: (info) => <BalanceAdjustCell userId={info.row.original.id} /> }),
    userColumns.accessor('is_active', { header: 'Status', cell: (info) => <ActiveToggle user={info.row.original} /> }),
  ], [])
  const table = useReactTable({ data: userData, columns, getCoreRowModel: getCoreRowModel() })
  const totals = aggregateByUser(transactions.data ?? [])

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2"><UserCreateForm /><DrinkCreateForm /></div>
      <Card><CardHeader><CardTitle>Benutzerverwaltung</CardTitle></CardHeader><CardContent className="overflow-x-auto"><Table><TableHeader>{table.getHeaderGroups().map((headerGroup) => <TableRow key={headerGroup.id}>{headerGroup.headers.map((header) => <TableHead key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.map((row) => <TableRow key={row.id}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>)}</TableBody></Table></CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5" /> Monatsübersicht & Export</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /><CsvExport transactions={transactions.data ?? []} /><Badge className="justify-center"><FileText className="mr-1 h-4 w-4" /> PDF vorbereitet</Badge></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{totals.map((row) => <div key={row.name} className="flex justify-between rounded-xl bg-slate-950 p-3"><span>{row.name}</span><strong>{formatCurrency(row.sum)}</strong></div>)}</div></CardContent></Card>
      <Card><CardHeader><CardTitle>Benutzer QR-Codes</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{userData.filter((user) => user.is_active).slice(0, 10).map((user) => <UserQrCode key={user.id} userId={user.id} name={user.name} />)}</CardContent></Card>
      <Card><CardHeader><CardTitle>Getränke</CardTitle></CardHeader><CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{(drinks.data ?? []).map((drink) => <div key={drink.id} className="rounded-xl bg-slate-950 p-3"><span className="text-2xl">{drink.icon}</span><p className="font-bold">{drink.name}</p><p className="text-muted-foreground">{formatCurrency(drink.price)} · Bestand {drink.stock}</p></div>)}</CardContent></Card>
    </div>
  )
}

function BalanceAdjustCell({ userId }: { userId: string }) {
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const mutation = useMutation({
    mutationFn: () => adjustBalance(userId, Number(amount), note.trim() || undefined),
    onSuccess: async () => { setAmount(''); setNote(''); toast.success('Kontostand angepasst'); await queryClient.invalidateQueries({ queryKey: ['users'] }) },
    onError: (error: Error) => toast.error(error.message),
  })

  function submit() {
    const parsed = balanceAdjustmentSchema.safeParse({ amount: Number(amount), note: note.trim() || undefined })
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? 'Ungültiger Betrag'); return }
    mutation.mutate()
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input className="h-10 w-24" type="number" step="0.01" placeholder="+/- Betrag" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <Input className="h-10 w-32" placeholder="Notiz" value={note} onChange={(e) => setNote(e.target.value)} />
      <Button type="button" size="sm" disabled={!amount || mutation.isPending} onClick={submit}>Anpassen</Button>
    </div>
  )
}

function ActiveToggle({ user }: { user: AppUser }) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (is_active: boolean) => updateUser(user.id, { name: user.name, email: user.email ?? '', role: user.role, balance: user.balance, is_active }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['users'] }) },
    onError: (error: Error) => toast.error(error.message),
  })
  return <Switch checked={user.is_active} onCheckedChange={(checked) => mutation.mutate(checked)} />
}

function aggregateByUser(transactions: Transaction[]) {
  return Object.values(transactions.reduce<Record<string, { name: string; sum: number }>>((acc, transaction) => {
    const name = transaction.user?.name ?? 'Unbekannt'
    acc[name] = { name, sum: (acc[name]?.sum ?? 0) + transaction.price }
    return acc
  }, {})).sort((a, b) => b.sum - a.sum)
}
