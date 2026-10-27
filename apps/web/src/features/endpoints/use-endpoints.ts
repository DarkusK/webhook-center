import { useQuery } from '@tanstack/react-query'
import { getEndpoints } from './endpoints.api.js'

export const endpointsQueryKey = ['endpoints'] as const
export function useEndpoints() {
  return useQuery({
    queryKey: endpointsQueryKey,
    queryFn: getEndpoints,
    retry: false,
  })
}
