import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service.js'
import { ConfigService } from '@nestjs/config'
import { randomBytes } from 'node:crypto'
import { Prisma, type WebhookEndpoint } from '../generated/prisma/client.js'
import type { DeletedEndpoint, PublicEndpoint } from './endpoints.types.js'
import type { CreateEndpointDto } from './dto/create-endpoint.dto.js'
import type { RenameEndpointDto } from './dto/rename-endpoint.dto.js'

const MAX_CAPTURE_TOKEN_ATTEMPTS = 3

@Injectable()
export class EndpointsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}
  private generateCaptureToken(): string {
    const buffer = randomBytes(32)
    return buffer.toString('base64url')
  }
  private toPublicEndpoint(endpoint: WebhookEndpoint): PublicEndpoint {
    const publicBaseUrl = this.configService.getOrThrow<string>('PUBLIC_BASE_URL')
    return {
      id: endpoint.id,
      name: endpoint.name,
      createdAt: endpoint.createdAt,
      updatedAt: endpoint.updatedAt,
      captureUrl: publicBaseUrl.replace(/\/+$/, '') + '/hooks/' + endpoint.captureToken,
    }
  }
  public async create(userId: number, dto: CreateEndpointDto): Promise<PublicEndpoint> {
    for (let attempt = 0; attempt < MAX_CAPTURE_TOKEN_ATTEMPTS; attempt += 1) {
      try {
        const endpoint = await this.prismaService.webhookEndpoint.create({
          data: {
            userId,
            name: dto.name,
            captureToken: this.generateCaptureToken(),
          },
        })
        return this.toPublicEndpoint(endpoint)
      } catch (error: unknown) {
        const isTokenCollision =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'

        if (!isTokenCollision || attempt === MAX_CAPTURE_TOKEN_ATTEMPTS - 1) {
          throw error
        }
      }
    }

    throw new Error('Failed to create endpoint')
  }
  async list(userId: number): Promise<PublicEndpoint[]> {
    const endpoints = await this.prismaService.webhookEndpoint.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return endpoints.map((endpoint) => this.toPublicEndpoint(endpoint))
  }
  async getById(userId: number, endpointId: number): Promise<PublicEndpoint> {
    const endpoint = await this.prismaService.webhookEndpoint.findFirst({
      where: {
        id: endpointId,
        userId,
      },
    })
    if (!endpoint) {
      throw new NotFoundException('Endpoint not found')
    }
    return this.toPublicEndpoint(endpoint)
  }
  async rename(
    userId: number,
    endpointId: number,
    dto: RenameEndpointDto,
  ): Promise<PublicEndpoint> {
    try {
      const endpoint = await this.prismaService.webhookEndpoint.update({
        where: {
          id: endpointId,
          userId,
        },
        data: {
          name: dto.name,
        },
      })
      return this.toPublicEndpoint(endpoint)
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Endpoint not found')
      }
      throw error
    }
  }
  async remove(userId: number, endpointId: number): Promise<DeletedEndpoint> {
    try {
      const endpoint = await this.prismaService.webhookEndpoint.delete({
        where: {
          id: endpointId,
          userId,
        },
      })
      return {
        id: endpoint.id,
      }
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Endpoint not found')
      }
      throw error
    }
  }
}
