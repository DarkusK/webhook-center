export interface PublicUser {
  id: number
  email: string
  createdAt: Date
}
export interface LoginResult {
  user: PublicUser
  sessionToken: string
  expiresAt: Date
}
export interface AuthenticatedSession {
  sessionId: number
  user: PublicUser
}
