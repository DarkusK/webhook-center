import { CanActivate, type ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Request } from 'express'

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
@Injectable()
export class SameOriginGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()
    if (!MUTATION_METHODS.has(request.method)) {
      return true
    }
    const origin = request.headers.origin
    const allowedOrigin = this.configService.getOrThrow<string>('WEB_ORIGIN')
    if (origin !== allowedOrigin) {
      throw new ForbiddenException('Invalid request origin')
    }
    return true
  }
}
