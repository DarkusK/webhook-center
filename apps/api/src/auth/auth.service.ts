import { Injectable, ConflictException } from '@nestjs/common'
import { Prisma } from '../generated/prisma/client.js'
import { PrismaService } from '../prisma/prisma.service.js'
import type { RegisterDto } from './dto/register.dto.js'
import type { PublicUser } from './auth.types.js'
import { hash, argon2id } from 'argon2'

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}
  async register(dto: RegisterDto): Promise<PublicUser> {
    const passwordHash = await hash(dto.password, {
      type: argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    })
    try {
      const user = await this.prismaService.user.create({
        data: {
          email: dto.email,
          passwordHash: passwordHash,
        },
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      })
      return user
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('An account with this email already exists. Sign in.')
      }
      throw error
    }
  }
}
