import { ConfigService } from '@nestjs/config'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { Test } from '@nestjs/testing'
import { AppModule } from '../src/app.module.js'
import { configureApp } from '../src/configure-app.js'
import { PrismaService } from '../src/prisma/prisma.service.js'
import request from 'supertest'

const CAPTURE_TOKEN = 'test-capture-token'
const MAX_BODY_SIZE_BYTES = 1024 * 1024
const oversizedBody = 'a'.repeat(MAX_BODY_SIZE_BYTES + 1)
function capturePath(token: string): string {
  return `/hooks/${token}`
}
describe('Public webhook capture', () => {
  let prisma: PrismaService
  let app: NestExpressApplication
  const supportedRequests = [
    {
      method: 'GET',
      send: () => request(app.getHttpServer()).get(capturePath(CAPTURE_TOKEN)),
    },
    {
      method: 'POST',
      send: () => request(app.getHttpServer()).post(capturePath(CAPTURE_TOKEN)),
    },
    {
      method: 'PUT',
      send: () => request(app.getHttpServer()).put(capturePath(CAPTURE_TOKEN)),
    },
    {
      method: 'PATCH',
      send: () => request(app.getHttpServer()).patch(capturePath(CAPTURE_TOKEN)),
    },
    {
      method: 'DELETE',
      send: () => request(app.getHttpServer()).delete(capturePath(CAPTURE_TOKEN)),
    },
  ]

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()
    prisma = moduleFixture.get(PrismaService)
    const configService = moduleFixture.get(ConfigService)
    const databaseUrl = configService.getOrThrow<string>('DATABASE_URL')
    const parsedUrl = new URL(databaseUrl)

    if (parsedUrl.pathname !== '/webhook_test') {
      throw new Error('Refusing to run tests outside webhook_test')
    }

    app = moduleFixture.createNestApplication<NestExpressApplication>()
    configureApp(app)
    await app.init()
  })

  beforeEach(async () => {
    await prisma.user.deleteMany()
    await prisma.user.create({
      data: {
        email: 'user@example.com',
        passwordHash: 'fwfaw52512gagtawga',
        endpoints: {
          create: {
            name: 'Test Endpoint',
            captureToken: CAPTURE_TOKEN,
          },
        },
      },
    })
  })

  it.each(supportedRequests)('accepts a public $method request', async ({ send }) => {
    const response = await send()
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ received: true })
  })
  it('returns 404 for an unknown token', async () => {
    const response = await request(app.getHttpServer()).get(capturePath('unknown-token'))
    expect(response.status).toBe(404)
  })
  it('returns 404 for a deleted endpoint', async () => {
    await prisma.webhookEndpoint.delete({ where: { captureToken: CAPTURE_TOKEN } })
    const response = await request(app.getHttpServer()).get(capturePath(CAPTURE_TOKEN))
    expect(response.status).toBe(404)
  })
  it('returns 405 and Allow header for an unsupported method', async () => {
    const response = await request(app.getHttpServer()).head(capturePath(CAPTURE_TOKEN))
    expect(response.status).toBe(405)
    expect(response.headers.allow).toBe('GET, POST, PUT, PATCH, DELETE')
  })
  it('rejects a request body larger than 1 MiB', async () => {
    const response = await request(app.getHttpServer())
      .post(capturePath(CAPTURE_TOKEN))
      .set('Content-Type', 'text/plain')
      .send(oversizedBody)
    expect(response.status).toBe(413)
    expect(response.body.message).toBe('Payload too large')
  })
  afterAll(async () => {
    await app.close()
  })
})
