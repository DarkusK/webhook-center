import { Module } from '@nestjs/common'
import { EndpointsController } from './endpoints.controller.js'
import { EndpointsService } from './endpoints.service.js'
import { PrismaModule } from '../prisma/prisma.module.js'
import { AuthModule } from '../auth/auth.module.js'

@Module({
  controllers: [EndpointsController],
  providers: [EndpointsService],
  imports: [PrismaModule, AuthModule],
})
export class EndpointsModule {}
