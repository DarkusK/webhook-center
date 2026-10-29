import { Test } from '@nestjs/testing'
import { AppModule } from '../src/app.module.js'
import { configureApp } from '../src/configure-app.js'
import { PrismaService } from '../src/prisma/prisma.service.js'
import request from 'supertest'
import { ConfigService } from '@nestjs/config'
import type { NestExpressApplication } from '@nestjs/platform-express'

const TEST_EMAIL = 'user@example.com'
const TEST_PASSWORD = 'passwordHuy12345678'
const INVALID_PASSWORD = 'HuevyPassword1234567'

describe('Authentication integration', () => {
  let app: NestExpressApplication
  let prisma: PrismaService
  let webOrigin: string

  async function registerUser(email = TEST_EMAIL, password = TEST_PASSWORD) {
    return request(app.getHttpServer())
      .post('/api/auth/register')
      .set('Origin', webOrigin)
      .send({ email, password })
  }
  async function loginUser(email = TEST_EMAIL, password = TEST_PASSWORD) {
    const agent = request.agent(app.getHttpServer())
    const response = await agent
      .post('/api/auth/login')
      .set('Origin', webOrigin)
      .send({ email, password })
    return {
      agent,
      response,
    }
  }
  async function registerValidUser(email = TEST_EMAIL, password = TEST_PASSWORD) {
    const response = await registerUser(email, password)
    expect(response.status).toBe(201)
    return response
  }
  async function createAuthenticatedSession(email = TEST_EMAIL, password = TEST_PASSWORD) {
    await registerValidUser(email, password)
    const result = await loginUser(email, password)
    expect(result.response.status).toBe(201)
    return result
  }
  // Выполнится один раз перед всеми тестами в блоке
  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()
    prisma = moduleFixture.get(PrismaService)
    app = moduleFixture.createNestApplication()
    const configService = moduleFixture.get(ConfigService)
    webOrigin = configService.getOrThrow<string>('WEB_ORIGIN')
    const databaseUrl = configService.getOrThrow<string>('DATABASE_URL')
    const parsedUrl = new URL(databaseUrl)

    const databaseName = parsedUrl.pathname
    if (databaseName !== '/webhook_test') throw Error('Refusing to run tests outside webhook_test')
    configureApp(app)
    await app.init()
  })
  beforeEach(async () => {
    await prisma.user.deleteMany()
  })
  it('rejects a request without a session cookie', async () => {
    const http = app.getHttpServer()
    const response = await request(http).get('/api/auth/me')
    expect(response.status).toBe(401)
    expect(response.body.message).toBe('Authentication required')
    expect(response.body.timestamp).toEqual(expect.any(String))
    expect(response.body.statusCode).toBe(401)
    expect(response.body.path).toBe('/api/auth/me')
  })
  it('registers a valid user', async () => {
    const response = await registerUser()
    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      id: expect.any(Number),
      email: TEST_EMAIL,
      createdAt: expect.any(String),
    })
    const user = await prisma.user.findUnique({
      where: {
        email: TEST_EMAIL,
      },
    })
    expect(user).not.toBeNull()
    expect(user?.passwordHash).not.toBe(TEST_PASSWORD)
  })

  it('rejects invalid registration data', async () => {
    const response = await registerUser('userexample.com', '2512515f')
    expect(response.status).toBe(400)
    const userCount = await prisma.user.count()
    expect(userCount).toBe(0)
  })

  it('rejects duplicate registration', async () => {
    await registerValidUser()
    const responseTwo = await registerUser()

    expect(responseTwo.status).toBe(409)
    expect(responseTwo.body.message).toBe('An account with this email already exists. Sign in.')
    const userCount = await prisma.user.count()
    expect(userCount).toBe(1)
  })

  it('logs in a valid user and sets a session cookie', async () => {
    await registerValidUser()

    const { agent, response: loginResponse } = await loginUser()

    expect(loginResponse.status).toBe(201)
    const setCookieHeader = loginResponse.headers['set-cookie']
    expect(setCookieHeader).toEqual(
      expect.arrayContaining([expect.stringContaining('webhook_center-session=')]),
    )
    const sessionCookie = setCookieHeader[0]
    expect(sessionCookie).toContain('HttpOnly')
    expect(sessionCookie).toContain('SameSite=Lax')
    expect(sessionCookie).toContain('Path=/')
    expect(sessionCookie).toContain('Expires=')
    expect(sessionCookie).not.toContain('Secure')
    const meResponse = await agent.get('/api/auth/me')
    expect(meResponse.status).toBe(200)
    expect(meResponse.body).toEqual(loginResponse.body)
  })

  it('rejects login with an invalid password', async () => {
    await registerValidUser()

    const { response: loginResponse } = await loginUser(TEST_EMAIL, INVALID_PASSWORD)
    expect(loginResponse.status).toBe(401)
    expect(loginResponse.body.message).toBe('Invalid email or password')
    expect(loginResponse.headers['set-cookie']).toBeUndefined()
    const sessionCount = await prisma.session.count()
    expect(sessionCount).toBe(0)
  })

  it('rejects login for an unknown email', async () => {
    const { response: loginResponse } = await loginUser('missing@example.com')
    expect(loginResponse.status).toBe(401)
    expect(loginResponse.body.message).toBe('Invalid email or password')
    expect(loginResponse.headers['set-cookie']).toBeUndefined()
    const sessionCount = await prisma.session.count()
    expect(sessionCount).toBe(0)
  })

  it('logs out an authenticated user', async () => {
    const { agent } = await createAuthenticatedSession()

    const delResponse = await agent.delete('/api/auth/session').set('Origin', webOrigin)

    expect(delResponse.status).toBe(204)

    const session = await prisma.session.findFirst()
    expect(session).not.toBeNull()
    expect(session?.revokedAt).toBeInstanceOf(Date)

    const meResponse = await agent.get('/api/auth/me')
    expect(meResponse.status).toBe(401)
  })

  it('rejects an expired session', async () => {
    const { agent } = await createAuthenticatedSession()
    const updateResult = await prisma.session.updateMany({
      data: {
        createdAt: new Date(Date.now() - 120_000),
        expiresAt: new Date(Date.now() - 60_000),
      },
    })
    expect(updateResult.count).toBe(1)
    const meResponse = await agent.get('/api/auth/me')
    expect(meResponse.status).toBe(401)
    expect(meResponse.body.message).toBe('Unauthorized')
  })

  it('keeps user sessions isolated', async () => {
    const { agent: firstAgent } = await createAuthenticatedSession('first@example.com')
    const firstMeResponse = await firstAgent.get('/api/auth/me')
    expect(firstMeResponse.status).toBe(200)
    const { agent: secondAgent } = await createAuthenticatedSession('second@example.com')
    const secondMeResponse = await secondAgent.get('/api/auth/me')
    expect(secondMeResponse.status).toBe(200)
    expect(firstMeResponse.body.email).toBe('first@example.com')
    expect(secondMeResponse.body.email).toBe('second@example.com')
    expect(firstMeResponse.body.id).not.toBe(secondMeResponse.body.id)
  })

  // Выполнится один раз после всех тестов в блоке
  afterAll(async () => {
    await app.close()
  })
})
