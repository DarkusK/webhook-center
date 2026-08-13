import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module.js'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)
  const port = configService.getOrThrow<number>('PORT')

  app.setGlobalPrefix('api')
  app.enableShutdownHooks()
  await app.listen(port)
}

void bootstrap()
