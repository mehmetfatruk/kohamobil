import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { errorMessage, resolveLocale } from '@mirakil/i18n';
import type { ErrorCode, ProblemDetails } from '@mirakil/types';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { DomainError } from './domain-error.js';

const TITLES: Partial<Record<ErrorCode, string>> = {
  VALIDATION_ERROR: 'Validation error',
  RESOURCE_NOT_FOUND: 'Not found',
  RATE_LIMITED: 'Too many requests',
  INTERNAL_ERROR: 'Internal error',
};

function codeForStatus(status: number): ErrorCode {
  if (status === 404) return 'RESOURCE_NOT_FOUND';
  if (status === 429) return 'RATE_LIMITED';
  if (status >= 400 && status < 500) return 'VALIDATION_ERROR';
  return 'INTERNAL_ERROR';
}

/**
 * Tüm hataları RFC 9457 Problem Details biçimine çevirir. İç hata ayrıntıları ve Koha'nın ham
 * yanıtları istemciye GİTMEZ; yalnızca loglanır.
 */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<FastifyRequest>();
    const reply = http.getResponse<FastifyReply>();

    let status = 500;
    let code: ErrorCode = 'INTERNAL_ERROR';
    let details: Record<string, unknown> | undefined;

    if (exception instanceof DomainError) {
      ({ status, code, details } = exception);
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = codeForStatus(status);
    }

    if (status >= 500) {
      this.logger.error({ err: exception, correlationId: request.id }, 'İşlenmeyen hata');
    }

    const locale = resolveLocale(request.headers['accept-language']);
    const body: ProblemDetails = {
      type: `https://api.koha-tr.com/errors/${code}`,
      title: TITLES[code] ?? code,
      status,
      code,
      message: errorMessage(code, locale, { correlationId: request.id }),
      correlationId: request.id,
      ...(details ? { details } : {}),
    };

    void reply.status(status).header('content-type', 'application/problem+json').send(body);
  }
}
