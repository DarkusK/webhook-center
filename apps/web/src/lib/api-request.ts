import { readErrorMessage } from './read-error-message.js'
import { ApiError } from './api-error.js'

export async function requestJson<T>(
  url: string,
  fallback: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, { ...options, credentials: 'same-origin' })
  if (!response.ok) {
    const errorMessage = await readErrorMessage(response, fallback)
    throw new ApiError(response.status, errorMessage)
  }
  return (await response.json()) as T
}
