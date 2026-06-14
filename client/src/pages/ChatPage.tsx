import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Chat from '../components/Chat';
import InputBar from '../components/InputBar';
import ErrorBanner from '../components/ErrorBanner';
import Sidebar from '../components/Sidebar';
import { useChat } from '../hooks/useChat';
import { useHistory } from '../hooks/useHistory';
import { useAppContext } from '../context/AppContext';
import type { Conversation, Message } from '../types';

const ERROR_CODE_TO_KEY: Record<string, string> = {
  GROQ_UNAVAILABLE: 'chat.errors.groqUnavailable',
  NETWORK_ERROR: 'chat.errors.generic',
};

export default function ChatPage() {
  const { t } = useTranslation();
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { setActiveConversationId } = useAppContext();
  const { conversations, getConversation, saveConversation, deleteConversation, createConversation } =
    useHistory();

  const conversationRef = useRef<Conversation | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    if (conversationRef.current?.id === conversationId) {
      setActiveConversationId(conversationId);
      setInitialMessages(conversationRef.current.messages);
      setActiveId(conversationId);
      return;
    }

    let cancelled = false;
    getConversation(conversationId).then((conversation) => {
      if (cancelled) return;
      if (conversation) {
        conversationRef.current = conversation;
        setActiveConversationId(conversation.id);
        setInitialMessages(conversation.messages);
        setActiveId(conversation.id);
      } else {
        const newConversation = createConversation();
        conversationRef.current = newConversation;
        setActiveConversationId(newConversation.id);
        navigate(`/chat/${newConversation.id}`, { replace: true });
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const handleExchangeComplete = (finalMessages: Message[]) => {
    if (!conversationRef.current) return;
    const updated: Conversation = { ...conversationRef.current, messages: finalMessages };
    conversationRef.current = updated;
    void saveConversation(updated);
  };

  const { messages, sendMessage, editMessage, startCheckIn, isStreaming, error, clearError } = useChat(
    initialMessages,
    handleExchangeComplete,
    activeId ?? undefined,
  );

  useEffect(() => {
    if (activeId && initialMessages.length === 0) {
      void startCheckIn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const handleNewConversation = () => {
    const conversation = createConversation();
    conversationRef.current = conversation;
    setActiveConversationId(conversation.id);
    setInitialMessages(conversation.messages);
    setActiveId(conversation.id);
    navigate(`/chat/${conversation.id}`);
  };

  const handleDeleteConversation = (id: string) => {
    const remaining = conversations
      .filter((c) => c.id !== id)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    void deleteConversation(id);

    if (id === activeId) {
      if (remaining.length > 0) {
        navigate(`/chat/${remaining[0].id}`);
      } else {
        handleNewConversation();
      }
    }
  };

  const errorMessage = error ? t(ERROR_CODE_TO_KEY[error] ?? 'chat.errors.generic') : null;

  return (
    <div className="flex h-full min-h-0">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeId}
        onSelectConversation={(id) => navigate(`/chat/${id}`)}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
      />
      <div className="flex flex-1 flex-col min-h-0">
        <Chat messages={messages} isStreaming={isStreaming} onEditMessage={editMessage} />
        {errorMessage && <ErrorBanner message={errorMessage} onDismiss={clearError} />}
        <InputBar onSend={sendMessage} disabled={isStreaming} />
      </div>
    </div>
  );
}
