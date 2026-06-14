import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import Sidebar from './Sidebar';
import type { Conversation } from '../types';

function renderWithRouter(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

const conversations: Conversation[] = [
  {
    id: 'conv-1',
    title: 'Première conversation',
    messages: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'conv-2',
    title: 'Conversation récente',
    messages: [],
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z',
  },
];

describe('Sidebar', () => {
  it('affiche les conversations triées par updatedAt décroissant avec une date formatée', () => {
    renderWithRouter(
      <Sidebar
        conversations={conversations}
        activeConversationId={null}
        onSelectConversation={vi.fn()}
        onNewConversation={vi.fn()}
        onDeleteConversation={vi.fn()}
      />,
    );

    const items = screen.getAllByRole('button').filter((btn) => btn.querySelector('span'));
    expect(items[0]).toHaveTextContent('Conversation récente');
    expect(items[1]).toHaveTextContent('Première conversation');
  });

  it('marque comme actif l\'élément correspondant à activeConversationId', () => {
    renderWithRouter(
      <Sidebar
        conversations={conversations}
        activeConversationId="conv-1"
        onSelectConversation={vi.fn()}
        onNewConversation={vi.fn()}
        onDeleteConversation={vi.fn()}
      />,
    );

    const activeItem = screen.getByText('Première conversation').closest('button');
    expect(activeItem).toHaveAttribute('aria-current', 'true');

    const inactiveItem = screen.getByText('Conversation récente').closest('button');
    expect(inactiveItem).not.toHaveAttribute('aria-current');
  });

  it('clic sur une conversation appelle onSelectConversation avec son id', () => {
    const onSelectConversation = vi.fn();
    renderWithRouter(
      <Sidebar
        conversations={conversations}
        activeConversationId={null}
        onSelectConversation={onSelectConversation}
        onNewConversation={vi.fn()}
        onDeleteConversation={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('Première conversation'));

    expect(onSelectConversation).toHaveBeenCalledWith('conv-1');
  });

  it('clic sur "Nouvelle conversation" appelle onNewConversation', () => {
    const onNewConversation = vi.fn();
    renderWithRouter(
      <Sidebar
        conversations={conversations}
        activeConversationId={null}
        onSelectConversation={vi.fn()}
        onNewConversation={onNewConversation}
        onDeleteConversation={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('Nouvelle conversation'));

    expect(onNewConversation).toHaveBeenCalled();
  });

  it('affiche un message d\'état vide quand conversations est vide, sans erreur', () => {
    renderWithRouter(
      <Sidebar
        conversations={[]}
        activeConversationId={null}
        onSelectConversation={vi.fn()}
        onNewConversation={vi.fn()}
        onDeleteConversation={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Aucune conversation pour l'instant. Démarre une nouvelle conversation pour commencer."),
    ).toBeInTheDocument();
    expect(screen.getByText('Nouvelle conversation')).toBeInTheDocument();
  });

  it('clic sur l\'icône poubelle ouvre la confirmation sans appeler onSelectConversation ni onDeleteConversation', () => {
    const onSelectConversation = vi.fn();
    const onDeleteConversation = vi.fn();
    renderWithRouter(
      <Sidebar
        conversations={conversations}
        activeConversationId={null}
        onSelectConversation={onSelectConversation}
        onNewConversation={vi.fn()}
        onDeleteConversation={onDeleteConversation}
      />,
    );

    fireEvent.click(screen.getAllByLabelText('Supprimer la conversation')[0]);

    expect(screen.getByText('Supprimer la conversation ?')).toBeInTheDocument();
    expect(screen.getByText('Cette action est définitive et ne peut pas être annulée.')).toBeInTheDocument();
    expect(onSelectConversation).not.toHaveBeenCalled();
    expect(onDeleteConversation).not.toHaveBeenCalled();
  });

  it('clic sur confirmer dans le dialogue appelle onDeleteConversation avec l\'id et ferme le dialogue', () => {
    const onDeleteConversation = vi.fn();
    renderWithRouter(
      <Sidebar
        conversations={conversations}
        activeConversationId={null}
        onSelectConversation={vi.fn()}
        onNewConversation={vi.fn()}
        onDeleteConversation={onDeleteConversation}
      />,
    );

    fireEvent.click(screen.getAllByLabelText('Supprimer la conversation')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    expect(onDeleteConversation).toHaveBeenCalledWith('conv-2');
    expect(screen.queryByText('Supprimer la conversation ?')).not.toBeInTheDocument();
  });

  it('clic sur annuler dans le dialogue ferme le dialogue sans appeler onDeleteConversation', () => {
    const onDeleteConversation = vi.fn();
    renderWithRouter(
      <Sidebar
        conversations={conversations}
        activeConversationId={null}
        onSelectConversation={vi.fn()}
        onNewConversation={vi.fn()}
        onDeleteConversation={onDeleteConversation}
      />,
    );

    fireEvent.click(screen.getAllByLabelText('Supprimer la conversation')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(onDeleteConversation).not.toHaveBeenCalled();
    expect(screen.queryByText('Supprimer la conversation ?')).not.toBeInTheDocument();
  });
});
