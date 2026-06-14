import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Message from './Message';

describe('Message', () => {
  it('aligne la bulle utilisateur à droite avec un style atténué', () => {
    render(<Message message={{ role: 'user', content: 'bonjour' }} />);
    const bubble = screen.getByText('bonjour').parentElement?.parentElement;
    expect(bubble?.className).toContain('ms-auto');
    expect(bubble?.className).toContain('bg-navy-800');
  });

  it('aligne la bulle coach à gauche avec un style accentué', () => {
    render(<Message message={{ role: 'assistant', content: 'salut' }} />);
    const bubble = screen.getByText('salut').parentElement?.parentElement;
    expect(bubble?.className).toContain('me-auto');
    expect(bubble?.className).toContain('border-accent');
  });

  it("affiche l'indicateur de frappe quand isStreaming est vrai pour une bulle coach", () => {
    render(<Message message={{ role: 'assistant', content: 'salut' }} isStreaming />);
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
  });

  it("n'affiche pas l'indicateur de frappe pour une bulle utilisateur même si isStreaming", () => {
    render(<Message message={{ role: 'user', content: 'salut' }} isStreaming />);
    expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument();
  });
});
