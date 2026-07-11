import { ChangePasswordForm } from '@/features/account/ChangePasswordForm'
import { PersonalStats } from '@/features/account/PersonalStats'

export function AccountPage() {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <PersonalStats />
      <ChangePasswordForm />
    </div>
  )
}
