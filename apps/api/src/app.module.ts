import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_FILTER } from '@nestjs/core'
import Joi from 'joi'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js'
import { HealthModule } from './health/health.module.js'
import { PrismaModule } from './prisma/prisma.module.js'
import { AuthModule } from './auth/auth.module.js'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env['NODE_ENV'] === 'test' ? '.env.test' : '.env',
      validationSchema: Joi.object({
        PORT: Joi.number().port().required(),
        DATABASE_URL: Joi.string().uri().required(),
        WEB_ORIGIN: Joi.string().uri().required(),
      }),
    }),
    HealthModule,
    PrismaModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
