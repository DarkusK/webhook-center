import type { Request } from 'express'
import type { AuthenticatedSession } from './auth.types.js'

export interface AuthenticatedRequest extends Request {
  auth: AuthenticatedSession
}
