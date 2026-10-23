import { type INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from '../src/app.module.js'
import { configureApp } from '../src/configure-app.js'
import { PrismaService } from '../src/prisma/prisma.service.js'
import request from 'supertest'
import { ConfigService } from '@nestjs/config'

describe('Authentication integration', () => {
  let app: INestApplication
  let prisma: PrismaService
  let configService: ConfigService

  async function registerUser(email: string, password: string) {
    const http = app.getHttpServer()
    const webOrigin = configService.getOrThrow<string>('WEB_ORIGIN')
    return request(http)
      .post('/api/auth/register')
      .set('Origin', webOrigin)
      .send({ email, password })
  }
  async function loginUser(email: string, password: string) {
    const http = app.getHttpServer()
    const webOrigin = configService.getOrThrow<string>('WEB_ORIGIN')
    const agent = request.agent(http)
    const response = await agent
      .post('/api/auth/login')
      .set('Origin', webOrigin)
      .send({ email, password })
    return {
      agent,
      response,
    }
  }
  // Выполнится один раз перед всеми тестами в блоке
  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()
    prisma = moduleFixture.get(PrismaService)
    app = moduleFixture.createNestApplication()
    configService = moduleFixture.get(ConfigService)
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
    const password = 'passwordHuy12345678'

    const response = await registerUser('user@example.com', password)
    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      id: expect.any(Number),
      email: 'user@example.com',
      createdAt: expect.any(String),
    })
    const user = await prisma.user.findUnique({
      where: {
        email: 'user@example.com',
      },
    })
    expect(user).not.toBeNull()
    expect(user?.passwordHash).not.toBe(password)
  })

  it('rejects invalid registration data', async () => {
    const response = await registerUser('userexample.com', '2512515f')
    expect(response.status).toBe(400)
    const userCount = await prisma.user.count()
    expect(userCount).toBe(0)
  })

  it('rejects duplicate registration ', async () => {
    const password = 'passwordHuy12345678'
    const responseOne = await registerUser('user@example.com', password)

    expect(responseOne.status).toBe(201)
    const responseTwo = await registerUser('user@example.com', password)

    expect(responseTwo.status).toBe(409)
    expect(responseTwo.body.message).toBe('An account with this email already exists. Sign in.')
    const userCount = await prisma.user.count()
    expect(userCount).toBe(1)
  })

  it('logs in a valid user and sets a session cookie ', async () => {
    const password = 'passwordHuy12345678'
    const response = await registerUser('user@example.com', password)
    expect(response.status).toBe(201)

    const { agent, response: loginResponse } = await loginUser('user@example.com', password)

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
    const response = await registerUser('user@example.com', 'passwordHuy12345678')

    expect(response.status).toBe(201)

    const { response: loginResponse } = await loginUser('user@example.com', 'HuevyPassword1234567')
    expect(loginResponse.status).toBe(401)
    expect(loginResponse.body.message).toBe('Invalid email or password')
    expect(loginResponse.headers['set-cookie']).toBeUndefined()
    const sessionCount = await prisma.session.count()
    expect(sessionCount).toBe(0)
  })
  it('rejects login for an unknown email ', async () => {
    const { response: loginResponse } = await loginUser('ne@ebu.com', 'passwordHuy12345678')
    expect(loginResponse.status).toBe(401)
    expect(loginResponse.body.message).toBe('Invalid email or password')
    expect(loginResponse.headers['set-cookie']).toBeUndefined()
    const sessionCount = await prisma.session.count()
    expect(sessionCount).toBe(0)
  })
  it('logs out an authenticated user ', async () => {
    const webOrigin = configService.getOrThrow<string>('WEB_ORIGIN')
    const password = 'passwordHuy12345678'
    const regResponse = await registerUser('user@example.com', password)
    expect(regResponse.status).toBe(201)

    const { agent } = await loginUser('user@example.com', password)

    const delResponse = await agent.delete('/api/auth/session').set('Origin', webOrigin)

    expect(delResponse.status).toBe(204)

    const session = await prisma.session.findFirst()
    expect(session).not.toBeNull()
    expect(session?.revokedAt).toBeInstanceOf(Date)

    const meResponse = await agent.get('/api/auth/me')
    expect(meResponse.status).toBe(401)
  })
  it('rejects an expired session ', async () => {
    const password = 'passwordHuy12345678'
    const regResponse = await registerUser('user@example.com', password)
    expect(regResponse.status).toBe(201)
    const { agent } = await loginUser('user@example.com', password)
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
    const regResponseOne = await registerUser('first@example.com', 'passwordHuy12345678')
    expect(regResponseOne.status).toBe(201)
    const regResponseTwo = await registerUser('second@example.com', '123passwordHuy12345678')
    expect(regResponseTwo.status).toBe(201)

    const { agent: firstAgent } = await loginUser('first@example.com', 'passwordHuy12345678')
    const firstMeResponse = await firstAgent.get('/api/auth/me')
    expect(firstMeResponse.status).toBe(200)
    const { agent: secondAgent } = await loginUser('second@example.com', '123passwordHuy12345678')
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
