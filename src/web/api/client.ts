import type { ErrorBody, ErrorCode } from '../../shared/api';
import { actingUserId } from '../session';
import { getPreviewMode } from './preview';

const BASE_URL = '/api/v1';
const SLOW_PREVIEW_MS = 3000;

export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly status: number,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

type RequestOptions = { method?: string; body?: unknown };

async function request<T>(path: string, { method = 'GET', body }: RequestOptions = {}): Promise<T> {
  const preview = getPreviewMode();
  if (preview === 'slow') await new Promise((resolve) => setTimeout(resolve, SLOW_PREVIEW_MS));
  if (preview === 'error') {
    throw new ApiError('UNEXPECTED', 500, 'Something spilled on our side. Please try again.');
  }

  const userId = actingUserId();
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(userId ? { 'X-User-Id': userId } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (payload as ErrorBody | null)?.error;
    throw new ApiError(
      error?.code ?? 'UNEXPECTED',
      response.status,
      error?.message ?? 'Something spilled on our side. Please try again.',
      error?.fields,
    );
  }
  return payload as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),

  /** A GET whose `key` holds a list, which the Empty preview blanks. */
  getList: async <T extends object>(path: string, key: keyof T): Promise<T> => {
    const data = await request<T>(path);
    return getPreviewMode() === 'empty' ? { ...data, [key]: [] } : data;
  },
};
