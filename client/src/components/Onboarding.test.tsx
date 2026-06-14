import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppContextProvider } from '../context/AppContext';
import { localStorageRepository } from '../repositories/LocalStorageRepository';
import Onboarding from './Onboarding';

function renderOnboarding() {
  return render(
    <AppContextProvider>
      <MemoryRouter initialEntries={['/onboarding']}>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/chat" element={<div>Page Chat</div>} />
        </Routes>
      </MemoryRouter>
    </AppContextProvider>
  );
}

describe('Onboarding', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("permet de passer l'onboarding via le bouton skip et redirige vers /chat", async () => {
    renderOnboarding();

    const skipButton = await screen.findByRole('button', { name: /passer pour l'instant/i });
    fireEvent.click(skipButton);

    await waitFor(() => {
      expect(screen.getByText('Page Chat')).toBeInTheDocument();
    });

    const stored = await localStorageRepository.getProfile();
    expect(stored).toEqual({ onboardingSkipped: true });
  });

  it('progresse à travers toutes les étapes, sauvegarde le profil complet et redirige vers /chat', async () => {
    renderOnboarding();

    // Étape 1: âge
    const ageInput = await screen.findByLabelText(/âge/i);
    fireEvent.change(ageInput, { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: /suivant/i }));

    // Étape 2: genre
    const genderInput = await screen.findByLabelText(/genre/i);
    fireEvent.change(genderInput, { target: { value: 'Femme' } });
    fireEvent.click(screen.getByRole('button', { name: /suivant/i }));

    // Étape 3: poids
    const weightInput = await screen.findByLabelText(/poids/i);
    fireEvent.change(weightInput, { target: { value: '65' } });
    fireEvent.click(screen.getByRole('button', { name: /suivant/i }));

    // Étape 4: objectif
    const goalInput = await screen.findByLabelText(/objectif/i);
    fireEvent.change(goalInput, { target: { value: 'Perte de poids' } });
    fireEvent.click(screen.getByRole('button', { name: /suivant/i }));

    // Étape 5: niveau d'activité
    const activityInput = await screen.findByLabelText(/niveau d'activité/i);
    fireEvent.change(activityInput, { target: { value: 'Modéré' } });
    fireEvent.click(screen.getByRole('button', { name: /suivant/i }));

    // Étape 6: restrictions alimentaires (dernière étape)
    const dietInput = await screen.findByLabelText(/restrictions alimentaires/i);
    fireEvent.change(dietInput, { target: { value: 'végétarien, sans gluten' } });
    fireEvent.click(screen.getByRole('button', { name: /valider/i }));

    await waitFor(() => {
      expect(screen.getByText('Page Chat')).toBeInTheDocument();
    });

    const stored = await localStorageRepository.getProfile();
    expect(stored).toEqual({
      age: 30,
      gender: 'Femme',
      weight: 65,
      goal: 'Perte de poids',
      activityLevel: 'Modéré',
      dietaryRestrictions: ['végétarien', 'sans gluten'],
    });
  });
});
