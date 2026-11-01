const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const MAX_OUTPUT_TOKENS = 300;

const DRAFT_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    offer: { type: 'string' },
    deliverable: { type: 'string' },
    spots: { type: 'integer' },
    endsOn: { type: 'string' },
  },
};

export type AiRequest = { system: string; user: string; signal: AbortSignal };

/** The one thing the app needs from a model. Tests pass in fixtures, so they never call one. */
export type AiClient = {
  /** Returns the raw output: a string or an object, depending on the model's mood. */
  generate: (request: AiRequest) => Promise<unknown>;
};

export function workersAiClient(ai: Ai): AiClient {
  return {
    generate: async ({ system, user, signal }) => {
      const output = await ai.run(
        MODEL,
        {
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          max_tokens: MAX_OUTPUT_TOKENS,
          response_format: { type: 'json_schema', json_schema: DRAFT_SCHEMA },
        },
        { signal },
      );
      return (output as { response?: unknown }).response;
    },
  };
}
