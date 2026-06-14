import ReactMarkdown from 'react-markdown';
import type { Message as MessageType } from '../types';

interface MessageProps {
  message: MessageType;
  isStreaming?: boolean;
}

export default function Message({ message, isStreaming }: MessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={
        isUser
          ? 'ms-auto max-w-[80%] rounded-lg bg-light-surface px-4 py-2 text-light-text dark:bg-navy-800 dark:text-warm-white'
          : 'me-auto max-w-[80%] rounded-lg border-s-2 border-accent bg-light-surface px-4 py-2 text-light-text dark:bg-navy-700 dark:text-warm-white'
      }
    >
      <div className="[&_p]:my-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:ps-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:ps-5 [&_strong]:font-semibold">
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>
      {!isUser && isStreaming && (
        <span className="ms-2 inline-flex gap-1" data-testid="typing-indicator">
          <span className="h-2 w-2 animate-bounce rounded-full bg-accent" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:0.3s]" />
        </span>
      )}
    </div>
  );
}
