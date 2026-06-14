import { useEffect, useState } from 'react';
import type { Profile } from '../schemas/profile.schema';
import { localStorageRepository } from '../repositories/LocalStorageRepository';
import { useAppContext } from '../context/AppContext';

export function useProfile() {
  const { profile, setProfile } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    localStorageRepository.getProfile().then((p) => {
      setProfile(p);
      setIsLoading(false);
    });
  }, [setProfile]);

  const saveProfile = async (newProfile: Profile): Promise<void> => {
    await localStorageRepository.saveProfile(newProfile);
    setProfile(newProfile);
  };

  return { profile, isLoading, saveProfile };
}
