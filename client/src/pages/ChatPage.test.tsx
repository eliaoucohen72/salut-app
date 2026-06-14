import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ChatPage from './ChatPage';
import type { Conversation, Message } from '../types';

const sendMessage = vi.fn();
const startCheckIn = vi.fn();
const clearError = vi.fn();
const setActiveConversationId = vi.fn();
const getConversation = vi.fn();
const saveConversation = vi.fn();
const deleteConversation = vi.fn();
const createConversation = vi.fn();

let mockChatState: {
  messages: Message[];
  sendMessage: typeof sendMessage;
  startCheckIn: typeof startCheckIn;
  isStreaming: boolean;
  error: string | null;
  clearError: typeof clearError;
};

let lastUseChatArgs: [Message[], ((messages: Message[]) => void) | undefined, string | undefined];

vi.mock('../hooks/useChat', () => ({
  useChat: (
    initialMessages: Message[],
    onExchangeComplete?: (messages: Message[]) => void,
    conversationId?: string,
  ) => {
    lastUseChatArgs = [initialMessages, onExchangeComplete, conversationId];
    return mockChatState;
  },
}));

let mockConversations: Conversation[] = [];

vi.mock('../hooks/useHistory', () => ({
  useHistory: () => ({
    conversations: mockConversations,
    isLoading: false,
    getConversation,
    saveConversation,
    deleteConversation,
    createConversation,
  }),
}));

vi.mock('../context/AppContext', () => ({
  useAppContext: () => ({
    profile: null,
    setProfile: vi.fn(),
    activeConversationId: null,
    setActiveConversationId,
    language: 'fr',
    setLanguage: vi.fn(),
  }),
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/chat/:conversationId" element={<ChatPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ChatPage', () => {
  let idCounter = 0;

  beforeEach(() => {
    sendMessage.mockClear();
    startCheckIn.mockClear();
    clearError.mockClear();
    setActiveConversationId.mockClear();
    getConversation.mockReset();
    saveConversation.mockClear();
    deleteConversation.mockClear();
    createConversation.mockReset();
    mockConversations = [];
    idCounter = 0;
    createConversation.mockImplementation(
      (): Conversation => ({
        id: `new-id-${++idCounter}`,
        title: 'Nouvelle conversation',
        messages: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
    );
    mockChatState = {
      messages: [],
      sendMessage,
      startCheckIn,
      isStreaming: false,
      error: null,
      clearError,
    };
  });

  it('accède à /chat/:id avec un id existant → charge les messages de cette conversation', async () => {
    const existing: Conversation = {
      id: 'conv-1',
      title: 'Conversation existante',
      messages: [{ role: 'user', content: 'salut' }],
      createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    };
    getConversation.mockResolvedValue(existing);

    renderAt('/chat/conv-1');

    await waitFor(() => {
      expect(getConversation).toHaveBeenCalledWith('conv-1');
    });

    await waitFor(() => {
      expect(lastUseChatArgs[0]).toEqual(existing.messages);
      expect(lastUseChatArgs[2]).toBe('conv-1');
    });

    expect(setActiveConversationId).toHaveBeenCalledWith('conv-1');
    expect(createConversation).not.toHaveBeenCalled();
  });

  it('accède à /chat/:id avec un id inexistant → redirige vers une nouvelle conversation', async () => {
    getConversation.mockResolvedValue(null);

    renderAt('/chat/inconnu');

    await waitFor(() => {
      expect(getConversation).toHaveBeenCalledWith('inconnu');
    });

    await waitFor(() => {
      expect(createConversation).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(lastUseChatArgs[2]).toBe('new-id-1');
    });
  });

  it('clic sur "Nouvelle conversation" → createConversation et navigation appelés', async () => {
    const existing: Conversation = {
      id: 'conv-1',
      title: 'Conversation existante',
      messages: [{ role: 'user', content: 'salut' }],
      createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    };
    getConversation.mockResolvedValue(existing);

    renderAt('/chat/conv-1');

    await waitFor(() => {
      expect(lastUseChatArgs[2]).toBe('conv-1');
    });

    fireEvent.click(screen.getByText('Nouvelle conversation'));

    await waitFor(() => {
      expect(createConversation).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(lastUseChatArgs[2]).toBe('new-id-1');
      expect(lastUseChatArgs[0]).toEqual([]);
    });

    expect(setActiveConversationId).toHaveBeenCalledWith('new-id-1');
  });

  it('après un échange complet, saveConversation est appelé avec les messages à jour', async () => {
    const existing: Conversation = {
      id: 'conv-1',
      title: 'Conversation existante',
      messages: [],
      createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
    };
    getConversation.mockResolvedValue(existing);

    renderAt('/chat/conv-1');

    await waitFor(() => {
      expect(lastUseChatArgs[2]).toBe('conv-1');
    });

    const finalMessages: Message[] = [
      { role: 'user', content: 'salut' },
      { role: 'assistant', content: 'bonjour' },
    ];

    lastUseChatArgs[1]?.(finalMessages);

    await waitFor(() => {
      expect(saveConversation).toHaveBeenCalledWith({ ...existing, messages: finalMessages });
    });
  });

  it('suppression de la conversation active avec d\'autres conversations existantes → navigation vers la plus récente restante', async () => {
    const conv1: Conversation = {
      id: 'conv-1',
      title: 'Conversation 1',
      messages: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const conv2: Conversation = {
      id: 'conv-2',
      title: 'Conversation 2',
      messages: [],
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    };
    mockConversations = [conv1, conv2];
    getConversation.mockImplementation((id: string) =>
      Promise.resolve(id === 'conv-1' ? conv1 : id === 'conv-2' ? conv2 : null),
    );

    renderAt('/chat/conv-1');

    await waitFor(() => {
      expect(lastUseChatArgs[2]).toBe('conv-1');
    });

    // conv2 (updatedAt plus récent) est trié en premier, conv1 (actif) en second
    const deleteButtons = screen.getAllByLabelText('Supprimer la conversation');
    fireEvent.click(deleteButtons[1]);
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    expect(deleteConversation).toHaveBeenCalledWith('conv-1');

    await waitFor(() => {
      expect(lastUseChatArgs[2]).toBe('conv-2');
    });
  });

  it('suppression de la conversation active sans autre conversation existante → nouvelle conversation créée et redirection', async () => {
    const conv1: Conversation = {
      id: 'conv-1',
      title: 'Conversation 1',
      messages: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    mockConversations = [conv1];
    getConversation.mockResolvedValue(conv1);

    renderAt('/chat/conv-1');

    await waitFor(() => {
      expect(lastUseChatArgs[2]).toBe('conv-1');
    });

    fireEvent.click(screen.getByLabelText('Supprimer la conversation'));
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    expect(deleteConversation).toHaveBeenCalledWith('conv-1');

    await waitFor(() => {
      expect(createConversation).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(lastUseChatArgs[2]).toBe('new-id-1');
    });
  });

  it('suppression d\'une conversation non active → deleteConversation appelé, pas de navigation', async () => {
    const conv1: Conversation = {
      id: 'conv-1',
      title: 'Conversation 1',
      messages: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    const conv2: Conversation = {
      id: 'conv-2',
      title: 'Conversation 2',
      messages: [],
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    };
    mockConversations = [conv1, conv2];
    getConversation.mockImplementation((id: string) =>
      Promise.resolve(id === 'conv-1' ? conv1 : id === 'conv-2' ? conv2 : null),
    );

    renderAt('/chat/conv-1');

    await waitFor(() => {
      expect(lastUseChatArgs[2]).toBe('conv-1');
    });

    setActiveConversationId.mockClear();

    // conv2 (updatedAt plus récent, non actif) est trié en premier
    const deleteButtons = screen.getAllByLabelText('Supprimer la conversation');
    fireEvent.click(deleteButtons[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    expect(deleteConversation).toHaveBeenCalledWith('conv-2');
    expect(setActiveConversationId).not.toHaveBeenCalled();
    expect(lastUseChatArgs[2]).toBe('conv-1');
  });
});

