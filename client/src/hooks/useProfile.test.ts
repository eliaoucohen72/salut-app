import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useProfile } from './useProfile';
import { AppContextProvider } from '../context/AppContext';
import { localStorageRepository } from '../repositories/LocalStorageRepository';

describe('useProfile', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('charge profile=null depuis le repository quand aucun profil n\'existe', async () => {
    const { result } = renderHook(() => useProfile(), { wrapper: AppContextProvider });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profile).toBeNull();
  });

  it('charge le profil existant depuis le repository au montage', async () => {
    await localStorageRepository.saveProfile({ name: 'Alice', age: 30 });

    const { result } = renderHook(() => useProfile(), { wrapper: AppContextProvider });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profile).toEqual({ name: 'Alice', age: 30 });
  });

  it('saveProfile persiste via le repository et met à jour le profil retourné', async () => {
    const { result } = renderHook(() => useProfile(), { wrapper: AppContextProvider });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.saveProfile({ age: 25, goal: 'Perte de poids' });
    });

    expect(result.current.profile).toEqual({ age: 25, goal: 'Perte de poids' });

    const stored = await localStorageRepository.getProfile();
    expect(stored).toEqual({ age: 25, goal: 'Perte de poids' });
  });
});
