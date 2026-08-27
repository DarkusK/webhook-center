import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module.js'
import { ValidationPipe } from '@nestjs/common'
import cookieParser from 'cookie-parser'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)
  const port = configService.getOrThrow<number>('PORT')
  const webOrigin = configService.getOrThrow<string>('WEB_ORIGIN')
  app.setGlobalPrefix('api')
  app.enableShutdownHooks()
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
  await app.listen(port)
}

void bootstrap()
