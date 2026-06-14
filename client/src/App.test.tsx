import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import i18n from './i18n';
import { localStorageRepository } from './repositories/LocalStorageRepository';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(async () => {
    await i18n.changeLanguage('fr');
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

  it('affiche le sélecteur de langue dans le header', async () => {
    render(<App />);

    expect(await screen.findByRole('combobox')).toBeInTheDocument();
  });

  it('sélectionner English met à jour les textes affichés sans rechargement', async () => {
    render(<App />);

    const select = await screen.findByRole('combobox');
    fireEvent.change(select, { target: { value: 'en' } });

    await waitFor(() => {
      expect(screen.getByText('Life Coach AI')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /switch to/i })).toBeInTheDocument();
    });
  });

  it('sélectionner une langue persiste le choix dans le repository (sans profil)', async () => {
    render(<App />);

    const select = await screen.findByRole('combobox');
    fireEvent.change(select, { target: { value: 'en' } });

    await waitFor(async () => {
      expect(await localStorageRepository.getLanguage()).toBe('en');
    });
  });

  it("restaure la langue 'he' depuis le profil au chargement (AC3/AC4)", async () => {
    await localStorageRepository.saveProfile({ language: 'he' });

    render(<App />);

    await waitFor(() => {
      expect(i18n.language).toBe('he');
      expect(document.documentElement.dir).toBe('rtl');
    });
  });

  it("restaure la langue 'en' depuis le repository au chargement quand aucun profil n'existe (AC3)", async () => {
    await localStorageRepository.setLanguage('en');

    render(<App />);

    await waitFor(() => {
      expect(i18n.language).toBe('en');
    });
  });
});
