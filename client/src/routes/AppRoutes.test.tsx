import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppContextProvider } from '../context/AppContext';
import { localStorageRepository } from '../repositories/LocalStorageRepository';
import AppRoutes from './AppRoutes';

function renderAt(path: string) {
  return render(
    <AppContextProvider>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AppContextProvider>
  );
}

describe('AppRoutes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirige vers /onboarding quand aucun profil n\'existe et /chat est demandé', async () => {
    renderAt('/chat');

    await waitFor(() => {
      expect(screen.getByText('Bienvenue !')).toBeInTheDocument();
    });
  });

  it('redirige vers /onboarding quand aucun profil n\'existe et /profile est demandé', async () => {
    renderAt('/profile');

    await waitFor(() => {
      expect(screen.getByText('Bienvenue !')).toBeInTheDocument();
    });
  });

  it("redirige vers /chat depuis / quand aucun profil n'existe (onboarding requis)", async () => {
    renderAt('/');

    await waitFor(() => {
      expect(screen.getByText('Bienvenue !')).toBeInTheDocument();
    });
  });

  it('ne redirige pas vers /onboarding quand un profil complet existe', async () => {
    await localStorageRepository.saveProfile({ name: 'Alice', age: 30 });

    renderAt('/chat');

    await waitFor(() => {
      expect(screen.getByText('Chat')).toBeInTheDocument();
    });
    expect(screen.queryByText('Bienvenue !')).not.toBeInTheDocument();
  });

  it('ne redirige pas vers /onboarding quand onboardingSkipped est true', async () => {
    await localStorageRepository.saveProfile({ onboardingSkipped: true });

    renderAt('/profile');

    await waitFor(() => {
      expect(screen.getByText('Mon profil')).toBeInTheDocument();
    });
    expect(screen.queryByText('Bienvenue !')).not.toBeInTheDocument();
  });

  it('accède à /onboarding directement même avec un profil existant', async () => {
    await localStorageRepository.saveProfile({ name: 'Alice', age: 30 });

    renderAt('/onboarding');

    await waitFor(() => {
      expect(screen.getByText('Bienvenue !')).toBeInTheDocument();
    });
  });
});
