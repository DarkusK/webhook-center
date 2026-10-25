import type { INestApplication } from '@nestjs/common'
import { PrismaService } from '../src/prisma/prisma.service.js'
import { ConfigService } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import { AppModule } from '../src/app.module.js'
import { configureApp } from '../src/configure-app.js'
import request from 'supertest'

const TEST_PASSWORD = 'testPassword12345'

interface EndpointResponse {
  id: number
  name: string
  captureUrl: string
  createdAt: string
  updatedAt: string
}

type TestAgent = ReturnType<typeof request.agent>

describe('Endpoint integration', () => {
  let app: INestApplication
  let prisma: PrismaService
  let webOrigin: string
  let publicBaseUrl: string

  async function createAuthenticatedAgent(email: string): Promise<TestAgent> {
    const agent = request.agent(app.getHttpServer())

    const registerResponse = await agent
      .post('/api/auth/register')
      .set('Origin', webOrigin)
      .send({ email, password: TEST_PASSWORD })
    expect(registerResponse.status).toBe(201)

    const loginResponse = await agent
      .post('/api/auth/login')
      .set('Origin', webOrigin)
      .send({ email, password: TEST_PASSWORD })
    expect(loginResponse.status).toBe(201)

    return agent
  }

  async function createEndpoint(agent: TestAgent, name: string): Promise<EndpointResponse> {
    const response = await agent.post('/api/endpoints').set('Origin', webOrigin).send({ name })
    expect(response.status).toBe(201)

    return response.body as EndpointResponse
  }

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()
    prisma = moduleFixture.get(PrismaService)
    app = moduleFixture.createNestApplication()
    const configService = moduleFixture.get(ConfigService)
    webOrigin = configService.getOrThrow<string>('WEB_ORIGIN')
    publicBaseUrl = configService.getOrThrow<string>('PUBLIC_BASE_URL').replace(/\/+$/, '')
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

  it('creates an endpoint for the authenticated user ', async () => {
    const agent = await createAuthenticatedAgent('owner@example.com')
    const response = await createEndpoint(agent, ' Primary endpoint ')
    expect(response).toEqual({
      id: expect.any(Number),
      captureUrl: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      name: 'Primary endpoint',
    })
    const endpoint = await prisma.webhookEndpoint.findUnique({
      where: { id: response.id },
      include: { user: true },
    })
    expect(endpoint).not.toBeNull()
    expect(endpoint?.name).toBe('Primary endpoint')
    expect(endpoint?.user.email).toBe('owner@example.com')
    expect(endpoint?.captureToken).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(response.captureUrl).toBe(publicBaseUrl + '/hooks/' + endpoint?.captureToken)
  })
  it('lists only endpoints owned by the authenticated user', async () => {
    const firstAgent = await createAuthenticatedAgent('first@example.com')
    const secondAgent = await createAuthenticatedAgent('second@example.com')

    await createEndpoint(firstAgent, ' FirstAgent endpoint 1 ')
    await createEndpoint(firstAgent, ' FirstAgent endpoint 2 ')
    await createEndpoint(secondAgent, ' SecondAgent endpoint 1 ')

    const firstAgentEndpoint = await firstAgent.get('/api/endpoints')
    expect(firstAgentEndpoint.status).toBe(200)
    expect(firstAgentEndpoint.body).toHaveLength(2)
    const firstNames = firstAgentEndpoint.body.map((endpoint: { name: string }) => endpoint.name)
    expect(firstNames).toEqual(
      expect.arrayContaining(['FirstAgent endpoint 1', 'FirstAgent endpoint 2']),
    )
    const secondAgentEndpoint = await secondAgent.get('/api/endpoints')
    const secondNames = secondAgentEndpoint.body.map((endpoint: { name: string }) => endpoint.name)
    expect(secondNames).toEqual(['SecondAgent endpoint 1'])

    expect(secondAgentEndpoint.status).toBe(200)
    expect(secondAgentEndpoint.body).toHaveLength(1)
  })

  it('returns an endpoint to its owner and hides it from another user', async () => {
    const ownerAgent = await createAuthenticatedAgent('owner@example.com')
    const secondAgent = await createAuthenticatedAgent('second@example.com')

    const ownerEndpoint = await createEndpoint(ownerAgent, ' FirstAgent endpoint 1 ')
    const ownerEndpointId = ownerEndpoint.id
    const ownerResponse = await ownerAgent.get(`/api/endpoints/${ownerEndpointId}`)
    expect(ownerResponse.status).toBe(200)
    expect(ownerResponse.body).toEqual(ownerEndpoint)

    const secondResponse = await secondAgent.get(`/api/endpoints/${ownerEndpointId}`)
    expect(secondResponse.status).toBe(404)
    expect(secondResponse.body.message).toBe('Endpoint not found')

    const ownerBadResponse = await ownerAgent.get('/api/endpoints/99999999')
    expect(ownerBadResponse.status).toBe(404)
    expect(ownerBadResponse.body.message).toBe('Endpoint not found')
  })
  it('renames an owned endpoint without changing its capture URL', async () => {
    const ownerAgent = await createAuthenticatedAgent('owner@example.com')
    const secondAgent = await createAuthenticatedAgent('second@example.com')

    const ownerEndpoint = await createEndpoint(ownerAgent, ' FirstAgent endpoint 1 ')
    const ownerEndpointId = ownerEndpoint.id
    const ownerEndpointCapUrl = ownerEndpoint.captureUrl
    const ownerResponse = await ownerAgent
      .patch(`/api/endpoints/${ownerEndpointId}`)
      .set('Origin', webOrigin)
      .send({ name: ' FirstAgent endpoint 2 ' })
    expect(ownerResponse.body.name).toBe('FirstAgent endpoint 2')
    expect(ownerResponse.status).toBe(200)
    expect(ownerResponse.body.id).toBe(ownerEndpointId)
    expect(ownerResponse.body.captureUrl).toBe(ownerEndpointCapUrl)

    const ownerNewNameResponse = await ownerAgent.get(`/api/endpoints/${ownerEndpointId}`)
    expect(ownerNewNameResponse.body.name).toBe('FirstAgent endpoint 2')
    expect(ownerNewNameResponse.status).toBe(200)

    const secondResponse = await secondAgent
      .patch(`/api/endpoints/${ownerEndpointId}`)
      .set('Origin', webOrigin)
      .send({ name: ' FirstAgent endpoint 2 ' })
    expect(secondResponse.status).toBe(404)
    expect(secondResponse.body.message).toBe('Endpoint not found')

    const ownerNewTryNameResponse = await ownerAgent.get(`/api/endpoints/${ownerEndpointId}`)
    expect(ownerNewTryNameResponse.body.name).toBe('FirstAgent endpoint 2')
    expect(ownerNewTryNameResponse.status).toBe(200)
  })

  it('deletes an owned endpoint with its events and rejects another user ', async () => {
    const ownerAgent = await createAuthenticatedAgent('owner@example.com')
    const secondAgent = await createAuthenticatedAgent('second@example.com')
    const ownerEndpoint = await createEndpoint(ownerAgent, ' FirstAgent endpoint 1 ')

    const event = await prisma.webhookEvent.create({
      data: {
        endpointId: ownerEndpoint.id,
        method: 'POST',
        path: '/cascade-test',
        headers: {},
        rawBody: Buffer.alloc(0),
        bodySizeBytes: 0,
      },
    })
    const rejectedDeleteResponse = await secondAgent
      .delete(`/api/endpoints/${ownerEndpoint.id}`)
      .set('Origin', webOrigin)
    expect(rejectedDeleteResponse.status).toBe(404)
    expect(rejectedDeleteResponse.body.message).toBe('Endpoint not found')
    const endpointAfterRejectedDelete = await prisma.webhookEndpoint.findUnique({
      where: { id: ownerEndpoint.id },
    })
    expect(endpointAfterRejectedDelete).not.toBeNull()
    const eventAfterRejectedDelete = await prisma.webhookEvent.findUnique({
      where: { id: event.id },
    })
    expect(eventAfterRejectedDelete).not.toBeNull()

    const ownerDeleteResponse = await ownerAgent
      .delete(`/api/endpoints/${ownerEndpoint.id}`)
      .set('Origin', webOrigin)
    expect(ownerDeleteResponse.status).toBe(200)
    expect(ownerDeleteResponse.body).toEqual({ id: ownerEndpoint.id })
    const endpointAfterDelete = await prisma.webhookEndpoint.findUnique({
      where: { id: ownerEndpoint.id },
    })
    expect(endpointAfterDelete).toBeNull()
    const eventAfterDelete = await prisma.webhookEvent.findUnique({ where: { id: event.id } })
    expect(eventAfterDelete).toBeNull()

    const deletedEndpointResponse = await ownerAgent.get(`/api/endpoints/${ownerEndpoint.id}`)
    expect(deletedEndpointResponse.status).toBe(404)
    expect(deletedEndpointResponse.body.message).toBe('Endpoint not found')
  })

  it('rejects invalid endpoint names and identifiers', async () => {
    const ownerAgent = await createAuthenticatedAgent('owner@example.com')
    const spacesNameResponse = await ownerAgent
      .post(`/api/endpoints/`)
      .set('Origin', webOrigin)
      .send({ name: '           ' })
    expect(spacesNameResponse.status).toBe(400)
    const name = 'S'
    const longNameResponse = await ownerAgent
      .post(`/api/endpoints/`)
      .set('Origin', webOrigin)
      .send({ name: name.repeat(101) })
    expect(longNameResponse.status).toBe(400)
    const endpointCount = await prisma.webhookEndpoint.count()
    expect(endpointCount).toBe(0)
    const invalidIds = [0, -1, 'abc']
    for (const id of invalidIds) {
      const response = await ownerAgent.get(`/api/endpoints/${id}`)
      expect(response.status).toBe(400)
    }
  })
  it('rejects unauthenticated endpoint requests', async () => {
    const http = app.getHttpServer()
    const response = await request(http).get(`/api/endpoints`)
    expect(response.status).toBe(401)
    expect(response.body.message).toBe('Authentication required')
  })
  it('rejects endpoint mutations with an invalid origin', async () => {
    const agent = await createAuthenticatedAgent('agent@exaple.com')
    const endpointResponse = await agent.post('/api/endpoints')
    expect(endpointResponse.status).toBe(403)
    const invalidOriginResponse = await agent
      .post('/api/endpoints')
      .set('Origin', 'http://evil.example')
    expect(invalidOriginResponse.status).toBe(403)
    const endpointCount = await prisma.webhookEndpoint.count()
    expect(endpointCount).toBe(0)
  })
  it('generates unique URL-safe capture tokens', async () => {
    const ownerAgent = await createAuthenticatedAgent('ownerAgent@example.com')
    for (let i = 1; i <= 20; i++) {
      await createEndpoint(ownerAgent, `token test ${i}`)
    }
    const endpointTokens = await prisma.webhookEndpoint.findMany({ select: { captureToken: true } })
    expect(endpointTokens.length).toBe(20)
    const captureTokens = endpointTokens.map((endpoint) => endpoint.captureToken)
    const uniqueTokens = new Set(captureTokens)
    expect(uniqueTokens.size).toBe(captureTokens.length)
    for (const token of captureTokens) {
      expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    }
  })
  afterAll(async () => {
    await app.close()
  })
})
