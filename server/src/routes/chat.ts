import { Router } from 'express';
import { ChatRequestSchema } from '../schemas/chat.schema';
import { buildSystemPrompt } from '../lib/systemPrompt';
import { streamChatCompletion } from '../lib/groqClient';

export const chatRouter = Router();

const GROQ_UNAVAILABLE_MESSAGE = 'The coach is temporarily unavailable. Please try again.';

chatRouter.post('/', async (req, res, next) => {
  let payload: ReturnType<typeof ChatRequestSchema.parse>;
  try {
    payload = ChatRequestSchema.parse(req.body);
  } catch (err) {
    next(err);
    return;
  }

  const { messages, profile } = payload;
  const systemPrompt = buildSystemPrompt(profile);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const result = await streamChatCompletion({ systemPrompt, messages }, (delta) => {
    res.write(`data: ${JSON.stringify({ delta })}\n\n`);
  });

  if (!result.ok) {
    res.write(
      `data: ${JSON.stringify({ error: { message: GROQ_UNAVAILABLE_MESSAGE, code: result.code } })}\n\n`,
    );
  }

  res.write('data: [DONE]\n\n');
  res.end();
});
