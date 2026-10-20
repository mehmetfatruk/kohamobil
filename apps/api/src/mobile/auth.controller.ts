import { Body, Controller, HttpCode, Inject, Post, Req, UseGuards } from '@nestjs/common';
import { LoginRequestSchema } from '@mirakil/types';
import type { FastifyRequest } from 'fastify';
import { z } from 'zod';

import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';
import { AuthService } from '../auth/auth.service.js';
import { ok, parse } from './http-helpers.js';

@Controller('mobile/v1/auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: unknown, @Req() request: FastifyRequest) {
    const login = parse(LoginRequestSchema.extend({ password: z.string().min(1).max(512) }), body);
    return ok(await this.auth.login(login, request.ip, request.id));
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() body: unknown, @Req() request: FastifyRequest) {
    const { refreshToken } = parse(z.object({ refreshToken: z.string().min(10).max(200) }), body);
    return ok(await this.auth.refresh(refreshToken, request.id));
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(AuthGuard)
  logout(@Req() request: AuthenticatedRequest) {
    this.auth.logout(request.session.id);
  }
}
