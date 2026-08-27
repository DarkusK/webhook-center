import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common'
import { Prisma } from '../generated/prisma/client.js'
import { PrismaService } from '../prisma/prisma.service.js'
import type { RegisterDto } from './dto/register.dto.js'
import type { AuthenticatedSession, LoginResult, PublicUser } from './auth.types.js'
import { hash, argon2id, verify } from 'argon2'
import type { LoginDto } from './dto/login.dto.js'
import * as crypto from 'node:crypto'

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000
const PASSWORD_HASH_OPTIONS = {
  type: argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const
const DUMMY_PASSWORD_HASH_PROMISE = hash(crypto.randomBytes(32), PASSWORD_HASH_OPTIONS)
@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}
  async register(dto: RegisterDto): Promise<PublicUser> {
    const passwordHash = await hash(dto.password, PASSWORD_HASH_OPTIONS)
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
  async login(dto: LoginDto, existingSessionToken?: string): Promise<LoginResult> {
    const user = await this.prismaService.user.findUnique({ where: { email: dto.email } })

    const passwordHash = user ? user.passwordHash : await DUMMY_PASSWORD_HASH_PROMISE
    const passwordMatches = await verify(passwordHash, dto.password)

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password')
    }
    if (existingSessionToken) {
      await this.revokeSessionByToken(existingSessionToken)
    }
    await this.cleanupExpiredSessions()
    const sessionToken = crypto.randomBytes(32).toString('base64url')
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
    await this.prismaService.session.create({
      data: {
        userId: user.id,
        tokenHash: this.hashSessionToken(sessionToken),
        expiresAt,
      },
    })
    return {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      },
      sessionToken,
      expiresAt,
    }
  }
  private hashSessionToken(sessionToken: string): string {
    return crypto.createHash('SHA-256').update(sessionToken).digest('hex')
  }
  public async authenticateSession(sessionToken: string): Promise<AuthenticatedSession> {
    const tokenHash = this.hashSessionToken(sessionToken)
    const session = await this.prismaService.session.findFirst({
      where: {
        tokenHash: tokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            email: true,
            createdAt: true,
          },
        },
      },
    })
    if (!session) {
      throw new UnauthorizedException()
    }

    return {
      sessionId: session.id,
      user: session.user,
    }
  }
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.prismaService.session.deleteMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
    })
    return result.count
  }
  async revokeSessionByToken(sessionToken: string): Promise<void> {
    const tokenHash = this.hashSessionToken(sessionToken)
    await this.prismaService.session.updateMany({
      where: {
        tokenHash: tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    })
  }
}
