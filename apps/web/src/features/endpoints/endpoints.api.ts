import type {
  DeletedEndpointResult,
  EndpointNameValues,
  PublicEndpoint,
} from './endpoints.types.js'
import { requestJson } from '../../lib/api-request.js'

export function getEndpoints(): Promise<PublicEndpoint[]> {
  return requestJson<PublicEndpoint[]>('/api/endpoints', 'Unable to get endpoints list')
}
export function createEndpoint(values: EndpointNameValues): Promise<PublicEndpoint> {
  return requestJson<PublicEndpoint>('/api/endpoints', 'Unable to create Endpoint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(values),
  })
}

export function renameEndpoint(id: number, values: EndpointNameValues): Promise<PublicEndpoint> {
  return requestJson<PublicEndpoint>(`/api/endpoints/${id}`, 'Unable to rename Endpoint', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(values),
  })
}
export function deleteEndpoint(id: number): Promise<DeletedEndpointResult> {
  return requestJson<DeletedEndpointResult>(`/api/endpoints/${id}`, 'Unable to delete endpoint', {
    method: 'DELETE',
  })
}
