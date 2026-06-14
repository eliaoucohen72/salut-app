import { describe, expect, it } from 'vitest';
import { ChatRequestSchema } from './chat.schema';

describe('ChatRequestSchema', () => {
  it('accepts a valid payload with messages and profile', () => {
    const payload = {
      messages: [
        { role: 'user', content: 'Bonjour' },
        { role: 'assistant', content: 'Salut !' },
      ],
      profile: {
        name: 'Alice',
        age: 30,
        weight: 60,
      },
    };

    expect(() => ChatRequestSchema.parse(payload)).not.toThrow();
  });

  it('accepts an empty messages array', () => {
    const payload = {
      messages: [],
      profile: {},
    };

    expect(() => ChatRequestSchema.parse(payload)).not.toThrow();
  });

  it('rejects a payload missing messages', () => {
    const payload = {
      profile: {},
    };

    expect(() => ChatRequestSchema.parse(payload)).toThrow();
  });

  it('rejects a payload with an invalid message role', () => {
    const payload = {
      messages: [{ role: 'bot', content: 'Hello' }],
      profile: {},
    };

    expect(() => ChatRequestSchema.parse(payload)).toThrow();
  });

  it('rejects a payload with a negative age in profile', () => {
    const payload = {
      messages: [],
      profile: { age: -5 },
    };

    expect(() => ChatRequestSchema.parse(payload)).toThrow();
  });
});
