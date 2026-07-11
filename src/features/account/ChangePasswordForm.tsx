import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { supabase } from '@/services/supabase'
import { passwordChangeSchema, type PasswordChangeValues } from '@/lib/validations'

export function ChangePasswordForm() {
  const [loading, setLoading] = useState(false)
  const form = useForm<PasswordChangeValues>({ resolver: zodResolver(passwordChangeSchema), defaultValues: { password: '', confirmPassword: '' } })

  async function submit(values: PasswordChangeValues) {
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: values.password, data: { must_change_password: false } })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    form.reset({ password: '', confirmPassword: '' })
    toast.success('Passwort geändert')
  }

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Passwort ändern</CardTitle></CardHeader>
      <CardContent>
        <form className="grid gap-3" onSubmit={form.handleSubmit(submit)}>
          <Input type="password" placeholder="Neues Passwort" {...form.register('password')} />
          <Input type="password" placeholder="Passwort bestätigen" {...form.register('confirmPassword')} />
          <FormError message={form.formState.errors.password?.message ?? form.formState.errors.confirmPassword?.message} />
          <Button disabled={loading}>Speichern</Button>
        </form>
      </CardContent>
    </Card>
  )
}

function FormError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-sm text-destructive">{message}</p>
}
