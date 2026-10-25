import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common'
import { SessionAuthGuard } from '../auth/session-auth.guard.js'
import { SameOriginGuard } from '../auth/same-origin.guard.js'
import { EndpointsService } from './endpoints.service.js'
import { CreateEndpointDto } from './dto/create-endpoint.dto.js'
import type { AuthenticatedRequest } from '../auth/auth-request.types.js'
import type { DeletedEndpoint, PublicEndpoint } from './endpoints.types.js'
import { EndpointIdParamsDto } from './dto/endpoint-id-params.dto.js'
import { RenameEndpointDto } from './dto/rename-endpoint.dto.js'
@UseGuards(SessionAuthGuard, SameOriginGuard)
@Controller('endpoints')
export class EndpointsController {
  constructor(private readonly endpointService: EndpointsService) {}

  @Post()
  async create(
    @Body() dto: CreateEndpointDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<PublicEndpoint> {
    return this.endpointService.create(request.auth.user.id, dto)
  }
  @Get()
  async list(@Req() request: AuthenticatedRequest): Promise<PublicEndpoint[]> {
    return this.endpointService.list(request.auth.user.id)
  }
  @Get(':id')
  async getById(
    @Param() params: EndpointIdParamsDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<PublicEndpoint> {
    return this.endpointService.getById(request.auth.user.id, params.id)
  }
  @Patch(':id')
  async rename(
    @Body() dto: RenameEndpointDto,
    @Param() params: EndpointIdParamsDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<PublicEndpoint> {
    return this.endpointService.rename(request.auth.user.id, params.id, dto)
  }
  @Delete(':id')
  async remove(
    @Param() params: EndpointIdParamsDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<DeletedEndpoint> {
    return this.endpointService.remove(request.auth.user.id, params.id)
  }
}
