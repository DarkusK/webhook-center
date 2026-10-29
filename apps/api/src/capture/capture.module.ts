import { Module } from '@nestjs/common'
import { CaptureController } from './capture.controller.js'
import { CaptureService } from './capture.service.js'
import { PrismaModule } from '../prisma/prisma.module.js'

@Module({
  controllers: [CaptureController],
  providers: [CaptureService],
  imports: [PrismaModule],
})
export class CaptureModule {}
