import Groq from 'groq-sdk';
import { APIError } from 'groq-sdk/core/error';

const MODEL = 'llama-3.3-70b-versatile';
const MAX_ATTEMPTS = 3;
const BACKOFF_DELAYS_MS = [500, 1000, 2000];

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type StreamChatCompletionInput = {
  systemPrompt: string;
  messages: ChatMessage[];
};

export type StreamChatCompletionResult = { ok: true } | { ok: false; code: 'GROQ_UNAVAILABLE' };

const isRetryableError = (err: unknown): boolean => {
  if (err instanceof APIError) {
    const status = err.status;
    return status === 429 || (typeof status === 'number' && status >= 500);
  }
  return true;
};

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export const streamChatCompletion = async (
  { systemPrompt, messages }: StreamChatCompletionInput,
  onDelta: (delta: string) => void,
): Promise<StreamChatCompletionResult> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { ok: false, code: 'GROQ_UNAVAILABLE' };
  }

  const groq = new Groq({ apiKey });
  let hasEmittedDelta = false;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const stream = await groq.chat.completions.create({
        model: MODEL,
        stream: true,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
      });

      for await (const chunk of stream as AsyncIterable<{
        choices: { delta: { content?: string | null } }[];
      }>) {
        const delta = chunk.choices[0]?.delta?.content ?? '';
        if (delta) {
          onDelta(delta);
          hasEmittedDelta = true;
        }
      }

      return { ok: true };
    } catch (err) {
      if (!hasEmittedDelta && attempt < MAX_ATTEMPTS && isRetryableError(err)) {
        await wait(BACKOFF_DELAYS_MS[attempt - 1]);
        continue;
      }
      return { ok: false, code: 'GROQ_UNAVAILABLE' };
    }
  }

  return { ok: false, code: 'GROQ_UNAVAILABLE' };
};
