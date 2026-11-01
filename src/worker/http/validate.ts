import type { Context } from 'hono';
import type { z } from 'zod';
import { DomainError } from './errors';

function validationError(error: z.ZodError): DomainError {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? 'body');
    fields[field] ??= issue.message;
  }
  return new DomainError('VALIDATION_FAILED', 422, 'Please check the highlighted fields.', fields);
}

export function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw validationError(result.error);
  return result.data;
}

export async function parseBody<T>(c: Context, schema: z.ZodType<T>): Promise<T> {
  const body: unknown = await c.req.json().catch(() => null);
  return parse(schema, body);
}
