import {
  All,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Req,
  Res,
} from '@nestjs/common'
import { CaptureService } from './capture.service.js'
import type { Request, Response } from 'express'
import type { CaptureAcknowledgement } from './capture.types.js'

const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
@Controller('hooks')
export class CaptureController {
  constructor(private readonly captureService: CaptureService) {}
  @All(':token')
  @HttpCode(HttpStatus.OK)
  async capture(
    @Param('token') token: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<CaptureAcknowledgement> {
    if (!ALLOWED_METHODS.has(request.method)) {
      const allowHeader = Array.from(ALLOWED_METHODS).join(', ')
      response.setHeader('Allow', allowHeader)
      throw new HttpException('Method not allowed', HttpStatus.METHOD_NOT_ALLOWED)
    }
    return this.captureService.capture(token)
  }
}
