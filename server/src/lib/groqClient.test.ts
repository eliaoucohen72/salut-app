import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RateLimitError, InternalServerError } from 'groq-sdk/core/error';

const createMock = vi.fn();

vi.mock('groq-sdk', () => ({
  default: class Groq {
    chat = { completions: { create: createMock } };
  },
}));

const makeStream = (chunks: string[]): AsyncIterable<unknown> => ({
  [Symbol.asyncIterator]() {
    let i = 0;
    return {
      next: async () => {
        if (i < chunks.length) {
          const value = { choices: [{ delta: { content: chunks[i] } }] };
          i += 1;
          return { value, done: false };
        }
        return { value: undefined, done: true };
      },
    };
  },
});

const makeError = (ErrorClass: typeof RateLimitError | typeof InternalServerError, status: number) =>
  new ErrorClass(status as 429, {}, 'error', new Headers());

describe('streamChatCompletion', () => {
  beforeEach(() => {
    createMock.mockReset();
    process.env.GROQ_API_KEY = 'gsk_test_key';
  });

  it('streams deltas in order on success', async () => {
    createMock.mockResolvedValueOnce(makeStream(['Hello', ' world']));

    const { streamChatCompletion } = await import('./groqClient');
    const deltas: string[] = [];
    const result = await streamChatCompletion(
      { systemPrompt: 'sys', messages: [{ role: 'user', content: 'hi' }] },
      (delta) => deltas.push(delta),
    );

    expect(result.ok).toBe(true);
    expect(deltas).toEqual(['Hello', ' world']);
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledWith({
      model: 'llama-3.3-70b-versatile',
      stream: true,
      messages: [
        { role: 'system', content: 'sys' },
        { role: 'user', content: 'hi' },
      ],
    });
  });

  it('retries on 429 then succeeds', async () => {
    createMock
      .mockRejectedValueOnce(makeError(RateLimitError, 429))
      .mockRejectedValueOnce(makeError(RateLimitError, 429))
      .mockResolvedValueOnce(makeStream(['ok']));

    const { streamChatCompletion } = await import('./groqClient');
    const deltas: string[] = [];
    const result = await streamChatCompletion(
      { systemPrompt: 'sys', messages: [] },
      (delta) => deltas.push(delta),
    );

    expect(result.ok).toBe(true);
    expect(deltas).toEqual(['ok']);
    expect(createMock).toHaveBeenCalledTimes(3);
  });

  it('returns GROQ_UNAVAILABLE after 3 failed attempts without extra calls', async () => {
    createMock
      .mockRejectedValueOnce(makeError(InternalServerError, 500))
      .mockRejectedValueOnce(makeError(InternalServerError, 500))
      .mockRejectedValueOnce(makeError(InternalServerError, 500));

    const { streamChatCompletion } = await import('./groqClient');
    const deltas: string[] = [];
    const result = await streamChatCompletion(
      { systemPrompt: 'sys', messages: [] },
      (delta) => deltas.push(delta),
    );

    expect(result).toEqual({ ok: false, code: 'GROQ_UNAVAILABLE' });
    expect(deltas).toEqual([]);
    expect(createMock).toHaveBeenCalledTimes(3);
  });

  it('returns GROQ_UNAVAILABLE without leaking the API key when GROQ_API_KEY is missing', async () => {
    delete process.env.GROQ_API_KEY;

    const { streamChatCompletion } = await import('./groqClient');
    const deltas: string[] = [];
    const result = await streamChatCompletion(
      { systemPrompt: 'sys', messages: [] },
      (delta) => deltas.push(delta),
    );

    expect(result).toEqual({ ok: false, code: 'GROQ_UNAVAILABLE' });
    expect(createMock).not.toHaveBeenCalled();
  });
});
