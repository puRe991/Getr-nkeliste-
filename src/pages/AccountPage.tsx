import { ChangePasswordForm } from '@/features/account/ChangePasswordForm'
import { PushToggleCard } from '@/features/push/PushToggleCard'

export function AccountPage() {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <ChangePasswordForm />
      <PushToggleCard />
    </div>
  )
}
