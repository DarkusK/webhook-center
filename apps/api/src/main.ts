import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module.js'
import { configureApp } from './configure-app.js'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)
  const port = configService.getOrThrow<number>('PORT')
  configureApp(app)
  app.enableShutdownHooks()
  await app.listen(port)
}

void bootstrap()
