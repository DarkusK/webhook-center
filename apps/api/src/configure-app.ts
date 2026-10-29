import { ConfigService } from '@nestjs/config'
import cookieParser from 'cookie-parser'
import { RequestMethod, ValidationPipe } from '@nestjs/common'
import type { NestExpressApplication } from '@nestjs/platform-express'
const BODY_LIMIT = '1mb'
export function configureApp(app: NestExpressApplication): void {
  const configService = app.get(ConfigService)

  const webOrigin = configService.getOrThrow<string>('WEB_ORIGIN')
  app.setGlobalPrefix('api', {
    exclude: [{ path: 'hooks/:token', method: RequestMethod.ALL }],
  })
  app.useBodyParser('json', {
    limit: BODY_LIMIT,
  })
  app.useBodyParser('urlencoded', {
    limit: BODY_LIMIT,
    extended: true,
  })
  app.useBodyParser('raw', {
    limit: BODY_LIMIT,
    type: '*/*',
  })
  app.use(cookieParser())
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  app.enableCors({
    origin: webOrigin,
    credentials: true,
  })
}
