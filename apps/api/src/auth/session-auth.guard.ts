import {
  CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { AuthService } from './auth.service.js'
import type { AuthenticatedRequest } from './auth-request.types.js'
import { SESSION_COOKIE_NAME } from './auth.constants.js'

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const sessionToken: unknown = request.cookies[SESSION_COOKIE_NAME]

    if (typeof sessionToken !== 'string' || sessionToken.length === 0) {
      throw new UnauthorizedException('Authentication required')
    }
    request.auth = await this.authService.authenticateSession(sessionToken)

    return true
  }
}
