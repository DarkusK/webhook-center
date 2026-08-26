import { Controller, Body, Post } from '@nestjs/common'
import { AuthService } from './auth.service.js'
import { RegisterDto } from './dto/register.dto.js'
import type { PublicUser } from './auth.types.js'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<PublicUser> {
    return this.authService.register(dto)
  }
}
