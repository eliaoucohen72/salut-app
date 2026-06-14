import { useState } from 'react';
import type { Message } from '../types';
import { useAppContext } from '../context/AppContext';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export function useChat(
  initialMessages: Message[] = [],
  onExchangeComplete?: (messages: Message[]) => void,
  conversationId?: string,
) {
  const { profile } = useAppContext();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedConversationId, setLoadedConversationId] = useState(conversationId);

  if (conversationId !== loadedConversationId) {
    setLoadedConversationId(conversationId);
    setMessages(initialMessages);
  }

  const clearError = () => setError(null);

  const runExchange = async (history: Message[]): Promise<void> => {
    if (isStreaming) return;
    if (!profile) return;

    setMessages(history);
    setIsStreaming(true);
    setError(null);

    let finalMessages = history;
    let hadError = false;

    try {
      const response = await fetch(`${apiBaseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, profile }),
      });

      if (!response.ok || !response.body) {
        setError('NETWORK_ERROR');
        setIsStreaming(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantStarted = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue;
          const json = part.slice('data: '.length);
          if (json === '[DONE]') {
            setIsStreaming(false);
            continue;
          }

          const parsed = JSON.parse(json) as {
            delta?: string;
            error?: { message: string; code: string };
          };

          if (parsed.error) {
            hadError = true;
            setError(parsed.error.code);
            continue;
          }

          if (typeof parsed.delta === 'string') {
            const delta = parsed.delta;
            if (!assistantStarted) {
              assistantStarted = true;
              finalMessages = [...finalMessages, { role: 'assistant', content: delta }];
            } else {
              const last = finalMessages[finalMessages.length - 1];
              finalMessages = [
                ...finalMessages.slice(0, -1),
                { ...last, content: last.content + delta },
              ];
            }
            setMessages(finalMessages);
          }
        }
      }

      setIsStreaming(false);

      if (!hadError) {
        onExchangeComplete?.(finalMessages);
      }
    } catch {
      setError('NETWORK_ERROR');
      setIsStreaming(false);
    }
  };

  const sendMessage = async (content: string): Promise<void> => {
    const userMessage: Message = { role: 'user', content };
    await runExchange([...messages, userMessage]);
  };

  const editMessage = async (index: number, content: string): Promise<void> => {
    if (isStreaming) return;
    if (messages[index]?.role !== 'user') return;

    const userMessage: Message = { role: 'user', content };
    await runExchange([...messages.slice(0, index), userMessage]);
  };

  const startCheckIn = async (): Promise<void> => {
    if (isStreaming) return;
    if (messages.length > 0) return;
    if (!profile) return;

    const kickoff: Message = {
      role: 'user',
      content:
        'This is the start of a new day. Proactively greet me and start a short daily check-in: ask how I feel today and how my progress is going toward my goal, in a warm and encouraging way.',
    };

    setMessages([]);
    setIsStreaming(true);
    setError(null);

    let finalMessages: Message[] = [];
    let hadError = false;

    try {
      const response = await fetch(`${apiBaseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [kickoff], profile }),
      });

      if (!response.ok || !response.body) {
        setError('NETWORK_ERROR');
        setIsStreaming(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantStarted = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue;
          const json = part.slice('data: '.length);
          if (json === '[DONE]') {
            setIsStreaming(false);
            continue;
          }

          const parsed = JSON.parse(json) as {
            delta?: string;
            error?: { message: string; code: string };
          };

          if (parsed.error) {
            hadError = true;
            setError(parsed.error.code);
            continue;
          }

          if (typeof parsed.delta === 'string') {
            const delta = parsed.delta;
            if (!assistantStarted) {
              assistantStarted = true;
              finalMessages = [{ role: 'assistant', content: delta }];
            } else {
              const last = finalMessages[finalMessages.length - 1];
              finalMessages = [{ ...last, content: last.content + delta }];
            }
            setMessages(finalMessages);
          }
        }
      }

      setIsStreaming(false);

      if (!hadError && finalMessages.length > 0) {
        onExchangeComplete?.(finalMessages);
      }
    } catch {
      setError('NETWORK_ERROR');
      setIsStreaming(false);
    }
  };

  return { messages, sendMessage, editMessage, startCheckIn, isStreaming, error, clearError };
}
