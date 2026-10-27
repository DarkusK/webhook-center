import type { AuthFormValues, PublicUser } from './auth.types.js'
import { ApiError } from '../../lib/api-error.js'
import { readErrorMessage } from '../../lib/read-error-message.js'

export async function getCurrentUser(): Promise<PublicUser | null> {
  const response = await fetch('/api/auth/me', { credentials: 'same-origin' })
  if (response.status === 401) {
    return null
  }
  if (!response.ok) {
    const errorMessage = await readErrorMessage(response, 'Unable to load session')
    throw new ApiError(response.status, errorMessage)
  }

  const data = (await response.json()) as PublicUser

  return data
}
export async function register(values: AuthFormValues): Promise<PublicUser> {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(values),
  })
  if (!response.ok) {
    const errorMessage = await readErrorMessage(response, 'Unable to register')
    throw new ApiError(response.status, errorMessage)
  }
  const data = (await response.json()) as PublicUser

  return data
}
export async function login(values: AuthFormValues): Promise<PublicUser> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(values),
  })
  if (!response.ok) {
    const errorMessage = await readErrorMessage(response, 'Unable to log in.')
    throw new ApiError(response.status, errorMessage)
  }
  const data = (await response.json()) as PublicUser

  return data
}
export async function logout(): Promise<void> {
  const response = await fetch('/api/auth/session', {
    method: 'DELETE',
    credentials: 'same-origin',
  })
  if (!response.ok) {
    const errorMessage = await readErrorMessage(response, 'Unable to log out.')
    throw new ApiError(response.status, errorMessage)
  }
}
