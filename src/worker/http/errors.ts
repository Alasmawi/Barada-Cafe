import type { ErrorHandler } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ErrorBody, ErrorCode } from '../../shared/api';
import type { AppEnv } from '../env';

/** A rule said no. Services throw it; `handleError` turns it into the error envelope. */
export class DomainError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly status: ContentfulStatusCode,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export const notFound = (message: string) => new DomainError('NOT_FOUND', 404, message);

export const handleError: ErrorHandler<AppEnv> = (error, c) => {
  if (error instanceof DomainError) {
    const body: ErrorBody = {
      error: { code: error.code, message: error.message, fields: error.fields },
    };
    return c.json(body, error.status);
  }

  console.error('Unexpected error', error);
  const body: ErrorBody = {
    error: { code: 'UNEXPECTED', message: 'Something spilled on our side. Please try again.' },
  };
  return c.json(body, 500);
};
