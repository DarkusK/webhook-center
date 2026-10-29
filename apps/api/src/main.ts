import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module.js'
import { configureApp } from './configure-app.js'
import type { NestExpressApplication } from '@nestjs/platform-express'
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const configService = app.get(ConfigService)
  const port = configService.getOrThrow<number>('PORT')
  configureApp(app)
  app.enableShutdownHooks()
  await app.listen(port)
}

void bootstrap()
