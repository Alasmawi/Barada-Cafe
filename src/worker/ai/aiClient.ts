const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const MAX_OUTPUT_TOKENS = 300;

export type AiRequest = {
  system: string;
  user: string;
  signal: AbortSignal;
  /** Asks for JSON in this shape. Left out, the model answers in plain text. */
  jsonSchema?: object;
};

/** The one thing the app needs from a model. Tests pass in fixtures, so they never call one. */
export type AiClient = {
  /** Returns the raw output: a string or an object, depending on the model's mood. */
  generate: (request: AiRequest) => Promise<unknown>;
};

export function workersAiClient(ai: Ai): AiClient {
  return {
    generate: async ({ system, user, signal, jsonSchema }) => {
      const output = await ai.run(
        MODEL,
        {
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          max_tokens: MAX_OUTPUT_TOKENS,
          ...(jsonSchema
            ? { response_format: { type: 'json_schema', json_schema: jsonSchema } }
            : {}),
        },
        { signal },
      );
      return (output as { response?: unknown }).response;
    },
  };
}
