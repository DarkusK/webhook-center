import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'

function getHttpExceptionMessage(exception: HttpException): string | string[] {
  const response = exception.getResponse()

  if (typeof response === 'string') {
    return response
  }

  if ('message' in response) {
    const message = response.message

    if (typeof message === 'string') {
      return message
    }

    if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
      return message
    }
  }

  return exception.message
}
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost
    const context = host.switchToHttp()
    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    const message =
      exception instanceof HttpException
        ? getHttpExceptionMessage(exception)
        : 'Internal server error'
    const request = context.getRequest()
    const responseBody = {
      statusCode,
      message,
      path: httpAdapter.getRequestUrl(request),
      timestamp: new Date().toISOString(),
    }

    httpAdapter.reply(context.getResponse(), responseBody, statusCode)
  }
}
