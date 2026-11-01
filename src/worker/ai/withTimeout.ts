import type { AiClient, AiRequest } from './aiClient';

export const AI_TIMEOUT_MS = 8000;

/** Raced as well as passed on, so a client that ignores the signal still can't hang a request. */
export function generateWithTimeout(
  client: AiClient,
  request: Omit<AiRequest, 'signal'>,
  callerSignal?: AbortSignal,
): Promise<unknown> {
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(new Error('AI timed out')), AI_TIMEOUT_MS);
  const signal = callerSignal ? AbortSignal.any([timeout.signal, callerSignal]) : timeout.signal;

  const aborted = new Promise<never>((_, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason as Error), { once: true });
  });
  return Promise.race([client.generate({ ...request, signal }), aborted]).finally(() =>
    clearTimeout(timer),
  );
}
