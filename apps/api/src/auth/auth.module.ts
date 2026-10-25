import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller.js'
import { AuthService } from './auth.service.js'
import { PrismaModule } from '../prisma/prisma.module.js'
import { SessionAuthGuard } from './session-auth.guard.js'
import { SameOriginGuard } from './same-origin.guard.js'

@Module({
  controllers: [AuthController],
  providers: [AuthService, SessionAuthGuard, SameOriginGuard],
  imports: [PrismaModule],
  exports: [SessionAuthGuard, SameOriginGuard, AuthService],
})
export class AuthModule {}
