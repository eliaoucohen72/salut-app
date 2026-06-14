import { z } from 'zod';
import { ProfileSchema } from './profile.schema';

export const ChatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    }),
  ),
  profile: ProfileSchema,
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
