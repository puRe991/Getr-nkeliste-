import { useQuery } from '@tanstack/react-query'
import { getDrinks, getRecentTransactions, getTransactions, getUsers } from '@/services/api'

export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: getUsers, staleTime: 30_000 })
}

export function useDrinks() {
  return useQuery({ queryKey: ['drinks'], queryFn: getDrinks, staleTime: 30_000 })
}

export function useTransactions(from?: string, to?: string) {
  return useQuery({ queryKey: ['transactions', from, to], queryFn: () => getTransactions(from, to), staleTime: 15_000 })
}

export function useRecentTransactions(limit = 8) {
  return useQuery({ queryKey: ['transactions', 'recent', limit], queryFn: () => getRecentTransactions(limit), staleTime: 5_000 })
}
