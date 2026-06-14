import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import type { Conversation } from '../types';

const setActiveConversationId = vi.fn();
const deleteConversation = vi.fn();
const createConversation = vi.fn();

let mockConversations: Conversation[] = [];

vi.mock('../hooks/useHistory', () => ({
  useHistory: () => ({
    conversations: mockConversations,
    isLoading: false,
    getConversation: vi.fn(),
    saveConversation: vi.fn(),
    deleteConversation,
    createConversation,
  }),
}));

vi.mock('../context/AppContext', () => ({
  useAppContext: () => ({
    setActiveConversationId,
  }),
}));

function renderHomePage() {
  return render(
    <MemoryRouter initialEntries={['/chat']}>
      <Routes>
        <Route path="/chat" element={<HomePage />} />
        <Route path="/chat/:conversationId" element={<div>Page Chat</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    setActiveConversationId.mockClear();
    deleteConversation.mockClear();
    createConversation.mockReset();
    mockConversations = [];
  });

  it('affiche le message de bienvenue sans créer de conversation', () => {
    renderHomePage();

    expect(screen.getByText('Bienvenue sur Life Coach AI')).toBeInTheDocument();
    expect(createConversation).not.toHaveBeenCalled();
  });

  it('clic sur "Nouvelle conversation" crée une conversation et navigue vers /chat/:id', async () => {
    createConversation.mockReturnValue({
      id: 'new-id-1',
      title: 'Nouvelle conversation',
      messages: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    renderHomePage();

    const buttons = screen.getAllByRole('button', { name: 'Nouvelle conversation' });
    fireEvent.click(buttons[buttons.length - 1]);

    expect(createConversation).toHaveBeenCalled();
    expect(setActiveConversationId).toHaveBeenCalledWith('new-id-1');

    await waitFor(() => {
      expect(screen.getByText('Page Chat')).toBeInTheDocument();
    });
  });
});
