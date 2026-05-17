import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { createDrink, createUser } from '@/services/api'
import { drinkSchema, userSchema, type DrinkFormValues, type UserFormValues } from '@/lib/validations'

export function UserCreateForm() {
  const queryClient = useQueryClient()
  const form = useForm<UserFormValues>({ resolver: zodResolver(userSchema), defaultValues: { name: '', role: 'mitglied', is_active: true, balance: 0 } })
  const mutation = useMutation({ mutationFn: createUser, onSuccess: async () => { form.reset(); toast.success('Mitglied angelegt'); await queryClient.invalidateQueries({ queryKey: ['users'] }) }, onError: (error) => toast.error(error.message) })
  return <Card><CardHeader><CardTitle>Mitglied anlegen</CardTitle></CardHeader><CardContent><form className="grid gap-3" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}><Input placeholder="Name" {...form.register('name')} /><Select {...form.register('role')}><option value="mitglied">Mitglied</option><option value="admin">Admin</option></Select><Input type="number" step="0.01" placeholder="Startguthaben" {...form.register('balance', { valueAsNumber: true })} /><label className="flex items-center justify-between rounded-xl border border-border p-3">Aktiv <Switch checked={form.watch('is_active')} onCheckedChange={(checked) => form.setValue('is_active', checked)} /></label><FormError message={form.formState.errors.name?.message ?? form.formState.errors.balance?.message} /><Button disabled={mutation.isPending}>Speichern</Button></form></CardContent></Card>
}

export function DrinkCreateForm() {
  const queryClient = useQueryClient()
  const form = useForm<DrinkFormValues>({ resolver: zodResolver(drinkSchema), defaultValues: { name: '', price: 1.5, stock: 24, is_active: true, icon: '🥤' } })
  const mutation = useMutation({ mutationFn: createDrink, onSuccess: async () => { form.reset({ name: '', price: 1.5, stock: 24, is_active: true, icon: '🥤' }); toast.success('Getränk angelegt'); await queryClient.invalidateQueries({ queryKey: ['drinks'] }) }, onError: (error) => toast.error(error.message) })
  return <Card><CardHeader><CardTitle>Getränk anlegen</CardTitle></CardHeader><CardContent><form className="grid gap-3" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}><Input placeholder="Name" {...form.register('name')} /><Input placeholder="Icon" maxLength={4} {...form.register('icon')} /><Input type="number" step="0.01" placeholder="Preis" {...form.register('price', { valueAsNumber: true })} /><Input type="number" step="1" placeholder="Bestand" {...form.register('stock', { valueAsNumber: true })} /><label className="flex items-center justify-between rounded-xl border border-border p-3">Aktiv <Switch checked={form.watch('is_active')} onCheckedChange={(checked) => form.setValue('is_active', checked)} /></label><FormError message={form.formState.errors.name?.message ?? form.formState.errors.price?.message ?? form.formState.errors.stock?.message} /><Button disabled={mutation.isPending}>Speichern</Button></form></CardContent></Card>
}

function FormError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-sm text-destructive">{message}</p>
}
