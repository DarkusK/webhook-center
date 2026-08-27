import {
  Controller,
  Body,
  Post,
  Res,
  Get,
  Req,
  UseGuards,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { AuthService } from './auth.service.js'
import { RegisterDto } from './dto/register.dto.js'
import type { PublicUser } from './auth.types.js'
import { LoginDto } from './dto/login.dto.js'
import type { Request, Response } from 'express'
import { ConfigService } from '@nestjs/config'
import { SESSION_COOKIE_NAME } from './auth.constants.js'
import type { AuthenticatedRequest } from './auth-request.types.js'
import { SessionAuthGuard } from './session-auth.guard.js'
import { SameOriginGuard } from './same-origin.guard.js'

@UseGuards(SameOriginGuard)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<PublicUser> {
    return this.authService.register(dto)
  }
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
    @Req() request: Request,
  ): Promise<PublicUser> {
    const sessionCookie: unknown = request.cookies[SESSION_COOKIE_NAME]
    const existingSessionToken = typeof sessionCookie === 'string' ? sessionCookie : undefined
    const { user, sessionToken, expiresAt } = await this.authService.login(
      dto,
      existingSessionToken,
    )
    response.cookie(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
      secure: this.configService.get<string>('NODE_ENV') === 'production',
    })
    return user
  }
  @Get('me')
  @UseGuards(SessionAuthGuard)
  currentUser(@Req() request: AuthenticatedRequest): PublicUser {
    return request.auth.user
  }
  @Delete('session')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const sessionCookie: unknown = request.cookies[SESSION_COOKIE_NAME]
    if (typeof sessionCookie === 'string') {
      await this.authService.revokeSessionByToken(sessionCookie)
    }

    response.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: this.configService.get<string>('NODE_ENV') === 'production',
    })
  }
}
