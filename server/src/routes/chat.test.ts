import { describe, expect, it, vi, beforeEach } from 'vitest';
import request from 'supertest';

const streamChatCompletionMock = vi.fn();

vi.mock('../lib/groqClient', () => ({
  streamChatCompletion: streamChatCompletionMock,
}));

const { default: app } = await import('../server');

describe('POST /api/chat', () => {
  beforeEach(() => {
    streamChatCompletionMock.mockReset();
  });

  it('returns a text/event-stream response with delta chunks ending in [DONE]', async () => {
    streamChatCompletionMock.mockImplementation(async (_input, onDelta) => {
      onDelta('Hello');
      onDelta(' world');
      return { ok: true };
    });

    const res = await request(app)
      .post('/api/chat')
      .send({
        messages: [{ role: 'user', content: 'Bonjour' }],
        profile: {},
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/event-stream/);
    expect(res.text).toContain('data: {"delta":"Hello"}\n\n');
    expect(res.text).toContain('data: {"delta":" world"}\n\n');
    expect(res.text.trim().endsWith('data: [DONE]')).toBe(true);
    expect(res.text).not.toMatch(/GROQ_API_KEY|gsk_/i);
  });

  it('sends a GROQ_UNAVAILABLE error event when streaming fails', async () => {
    streamChatCompletionMock.mockResolvedValue({ ok: false, code: 'GROQ_UNAVAILABLE' });

    const res = await request(app)
      .post('/api/chat')
      .send({
        messages: [{ role: 'user', content: 'Bonjour' }],
        profile: {},
      });

    expect(res.status).toBe(200);
    expect(res.text).toContain('data: {"error":{"message":');
    expect(res.text).toContain('"code":"GROQ_UNAVAILABLE"');
    expect(res.text.trim().endsWith('data: [DONE]')).toBe(true);
  });

  it('returns 400 VALIDATION_ERROR when messages is missing', async () => {
    const res = await request(app).post('/api/chat').send({ profile: {} });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('includes helmet security headers', async () => {
    const res = await request(app).get('/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('returns 429 RATE_LIMITED once the limit is exceeded', async () => {
    streamChatCompletionMock.mockResolvedValue({ ok: true });
    let limitedResponse: request.Response | undefined;

    for (let i = 0; i < 25; i += 1) {
      const res = await request(app)
        .post('/api/chat')
        .send({ messages: [], profile: {} });

      if (res.status === 429) {
        limitedResponse = res;
        break;
      }
    }

    expect(limitedResponse).toBeDefined();
    expect(limitedResponse?.body.error.code).toBe('RATE_LIMITED');
  });
});
