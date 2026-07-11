import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { getUsers } from '@/services/api'

export function useCurrentUser() {
  const { session } = useAuth()
  const query = useQuery({ queryKey: ['users'], queryFn: getUsers, staleTime: 30_000, enabled: !!session })
  const data = query.data?.find((user) => user.auth_user_id === session?.user.id)
  return { ...query, data }
}
