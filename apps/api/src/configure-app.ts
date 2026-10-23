import { ConfigService } from '@nestjs/config'
import cookieParser from 'cookie-parser'
import { type INestApplication, ValidationPipe } from '@nestjs/common'

export function configureApp(app: INestApplication): void {
  const configService = app.get(ConfigService)

  const webOrigin = configService.getOrThrow<string>('WEB_ORIGIN')
  app.setGlobalPrefix('api')
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
