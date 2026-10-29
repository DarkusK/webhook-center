import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import type { CaptureAcknowledgement } from './capture.types.js'

@Injectable()
export class CaptureService {
  constructor(private readonly prismaService: PrismaService) {}
  async capture(token: string): Promise<CaptureAcknowledgement> {
    const endpoint = await this.prismaService.webhookEndpoint.findUnique({
      where: {
        captureToken: token,
      },
      select: {
        id: true,
      },
    })
    if (!endpoint) {
      throw new NotFoundException('Webhook endpoint not found')
    }
    return {
      received: true,
    }
  }
}
