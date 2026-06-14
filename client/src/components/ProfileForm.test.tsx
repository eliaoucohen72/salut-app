import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppContextProvider } from '../context/AppContext';
import { localStorageRepository } from '../repositories/LocalStorageRepository';
import ProfileForm from './ProfileForm';

function renderProfileForm() {
  return render(
    <AppContextProvider>
      <ProfileForm />
    </AppContextProvider>
  );
}

describe('ProfileForm', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('affiche les valeurs actuelles du profil au montage', async () => {
    await localStorageRepository.saveProfile({
      name: 'Alice',
      age: 30,
      gender: 'Femme',
      weight: 65,
      goal: 'Perte de poids',
      activityLevel: 'Modéré',
      dietaryRestrictions: ['végétarien', 'sans gluten'],
    });

    renderProfileForm();

    await waitFor(() => {
      expect(screen.getByLabelText(/nom/i)).toHaveValue('Alice');
    });
    expect(screen.getByLabelText(/âge/i)).toHaveValue(30);
    expect(screen.getByLabelText(/genre/i)).toHaveValue('Femme');
    expect(screen.getByLabelText(/poids/i)).toHaveValue(65);
    expect(screen.getByLabelText(/objectif/i)).toHaveValue('Perte de poids');
    expect(screen.getByLabelText(/niveau d'activité/i)).toHaveValue('Modéré');
    expect(screen.getByLabelText(/restrictions alimentaires/i)).toHaveValue(
      'végétarien, sans gluten'
    );
  });

  it('soumission avec valeurs modifiées valides sauvegarde le profil et affiche la confirmation', async () => {
    await localStorageRepository.saveProfile({ name: 'Alice', age: 30 });

    renderProfileForm();

    const nameInput = await screen.findByLabelText(/nom/i);
    await waitFor(() => {
      expect(nameInput).toHaveValue('Alice');
    });
    fireEvent.change(nameInput, { target: { value: 'Bob' } });

    const ageInput = screen.getByLabelText(/âge/i);
    fireEvent.change(ageInput, { target: { value: '40' } });

    fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }));

    await waitFor(() => {
      expect(screen.getByText(/profil mis à jour avec succès/i)).toBeInTheDocument();
    });

    const stored = await localStorageRepository.getProfile();
    expect(stored?.name).toBe('Bob');
    expect(stored?.age).toBe(40);
  });

  it('soumission avec un poids négatif affiche une erreur et ne persiste pas', async () => {
    await localStorageRepository.saveProfile({ name: 'Alice', weight: 65 });

    renderProfileForm();

    const weightInput = await screen.findByLabelText(/poids/i);
    await waitFor(() => {
      expect(weightInput).toHaveValue(65);
    });
    fireEvent.change(weightInput, { target: { value: '-5' } });

    fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }));

    await waitFor(() => {
      expect(screen.getByText(/too small|positive|supérieur/i)).toBeInTheDocument();
    });

    const stored = await localStorageRepository.getProfile();
    expect(stored?.weight).toBe(65);
    expect(screen.queryByText(/profil mis à jour avec succès/i)).not.toBeInTheDocument();
  });
});
