import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InputBar from './InputBar';

describe('InputBar', () => {
  it('appelle onSend avec le contenu saisi et vide le champ', () => {
    const onSend = vi.fn();
    render(<InputBar onSend={onSend} disabled={false} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'bonjour' } });
    fireEvent.click(screen.getByRole('button'));

    expect(onSend).toHaveBeenCalledWith('bonjour');
    expect(input).toHaveValue('');
  });

  it("n'appelle pas onSend pour un contenu vide ou composé uniquement d'espaces", () => {
    const onSend = vi.fn();
    render(<InputBar onSend={onSend} disabled={false} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button'));

    expect(onSend).not.toHaveBeenCalled();
  });

  it('désactive le champ et le bouton quand disabled est true', () => {
    const onSend = vi.fn();
    render(<InputBar onSend={onSend} disabled={true} />);

    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('envoie le message avec la touche Entrée', () => {
    const onSend = vi.fn();
    render(<InputBar onSend={onSend} disabled={false} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'salut' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSend).toHaveBeenCalledWith('salut');
  });

  it("n'envoie pas le message avec Shift+Entrée et permet le saut de ligne", () => {
    const onSend = vi.fn();
    render(<InputBar onSend={onSend} disabled={false} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'salut' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

    expect(onSend).not.toHaveBeenCalled();
    expect(input).toHaveValue('salut');
  });
});
