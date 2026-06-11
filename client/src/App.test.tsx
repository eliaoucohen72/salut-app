import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { localStorageRepository } from './repositories/LocalStorageRepository';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('affiche la modale de disclaimer si elle n\'a pas été acquittée', async () => {
    render(<App />);

    expect(await screen.findByText('Avertissement médical')).toBeInTheDocument();
  });

  it("n'affiche pas la modale de disclaimer si elle a déjà été acquittée", async () => {
    await localStorageRepository.setDisclaimerAcknowledged();

    render(<App />);

    await waitFor(() => {
      expect(screen.queryByText('Avertissement médical')).not.toBeInTheDocument();
    });
  });

  it('le clic sur le bouton de confirmation ferme la modale et persiste le flag', async () => {
    render(<App />);

    const button = await screen.findByRole('button', { name: "J'ai compris" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.queryByText('Avertissement médical')).not.toBeInTheDocument();
    });

    const acknowledged = await localStorageRepository.getDisclaimerAcknowledged();
    expect(acknowledged).toBe(true);
  });
});
