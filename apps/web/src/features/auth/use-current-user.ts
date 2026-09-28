import { useQuery } from '@tanstack/react-query'
import { getCurrentUser } from './auth.api.js'

export const currentUserQueryKey = ['current-user'] as const
export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
    retry: false,
  })
}
