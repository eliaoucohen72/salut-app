import express from 'express';
import { securityHeaders, corsMiddleware, chatRateLimiter } from './middleware/security';
import { errorHandler } from './middleware/errorHandler';
import { chatRouter } from './routes/chat';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(securityHeaders);
app.use(corsMiddleware);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/chat', chatRateLimiter, chatRouter);

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
