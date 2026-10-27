import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createEndpoint, deleteEndpoint, renameEndpoint } from './endpoints.api.js'
import { endpointsQueryKey } from './use-endpoints.js'
import type { EndpointNameValues } from './endpoints.types.js'

interface RenameEndpointVariables {
  id: number
  values: EndpointNameValues
}

export function useCreateEndpoint() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createEndpoint,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: endpointsQueryKey,
      })
    },
  })
}
export function useRenameEndpoint() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: RenameEndpointVariables) => renameEndpoint(id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: endpointsQueryKey,
      })
    },
  })
}
export function useDeleteEndpoint() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteEndpoint,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: endpointsQueryKey,
      })
    },
  })
}
