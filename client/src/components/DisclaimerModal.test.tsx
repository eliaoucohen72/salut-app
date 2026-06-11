import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DisclaimerModal from './DisclaimerModal';

describe('DisclaimerModal', () => {
  it('affiche le texte du disclaimer médical', () => {
    render(<DisclaimerModal onAcknowledge={() => {}} />);

    expect(screen.getByText('Avertissement médical')).toBeInTheDocument();
    expect(screen.getByText(/ne fournit pas de diagnostic médical/)).toBeInTheDocument();
    expect(screen.getByText(/Consultez un médecin/)).toBeInTheDocument();
  });

  it("appelle onAcknowledge au clic sur le bouton", () => {
    const onAcknowledge = vi.fn();
    render(<DisclaimerModal onAcknowledge={onAcknowledge} />);

    fireEvent.click(screen.getByRole('button', { name: "J'ai compris" }));

    expect(onAcknowledge).toHaveBeenCalledTimes(1);
  });
});
