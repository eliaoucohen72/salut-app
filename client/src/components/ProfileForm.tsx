import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ZodError } from 'zod';
import type { Profile } from '../schemas/profile.schema';
import { useProfile } from '../hooks/useProfile';

const TEXT_FIELDS: ('name' | 'gender' | 'goal' | 'activityLevel')[] = [
  'name',
  'gender',
  'goal',
  'activityLevel',
];

const NUMBER_FIELDS: ('age' | 'weight')[] = ['age', 'weight'];

const ERROR_KEYS: Record<string, string> = {
  age: 'profile.errors.agePositive',
  weight: 'profile.errors.weightPositive',
};

export default function ProfileForm() {
  const { t } = useTranslation();
  const { profile, isLoading, saveProfile } = useProfile();
  const [formData, setFormData] = useState<Partial<Profile>>(profile ?? {});
  const [dietaryInput, setDietaryInput] = useState(
    (profile?.dietaryRestrictions ?? []).join(', ')
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (!isLoading && profile) {
      setFormData(profile);
      setDietaryInput((profile.dietaryRestrictions ?? []).join(', '));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const handleTextChange = (key: keyof Profile, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value.trim() || undefined }));
  };

  const handleNumberChange = (key: 'age' | 'weight', value: string) => {
    const trimmed = value.trim();
    const parsed = trimmed === '' ? undefined : Number(trimmed);
    setFormData((prev) => ({
      ...prev,
      [key]: Number.isNaN(parsed) ? undefined : parsed,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setShowConfirmation(false);

    const items = dietaryInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updated: Partial<Profile> = {
      ...formData,
      dietaryRestrictions: items.length > 0 ? items : undefined,
    };

    try {
      await saveProfile(updated as Profile);
      setFormData(updated);
      setShowConfirmation(true);
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of err.issues) {
          const field = issue.path[0] as string;
          const key = ERROR_KEYS[field];
          fieldErrors[field] = key ? t(key) : issue.message;
        }
        setErrors(fieldErrors);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-8">
      <form
        onSubmit={handleSubmit}
        className="max-w-md w-full bg-light-bg border border-light-border rounded-lg p-6 text-light-text dark:bg-navy-900 dark:border-navy-700 dark:text-warm-white"
      >
        <h1 className="text-lg font-semibold text-accent mb-3">{t('profile.title')}</h1>

        {showConfirmation && (
          <p className="text-sm text-accent mb-4">{t('profile.confirmation')}</p>
        )}

        {TEXT_FIELDS.map((key) => (
          <div key={key} className="mb-4">
            <label htmlFor={`profile-${key}`} className="block text-sm mb-1">
              {t(`profile.fields.${key}`)}
            </label>
            <input
              id={`profile-${key}`}
              type="text"
              value={(formData[key] as string) ?? ''}
              onChange={(e) => handleTextChange(key, e.target.value)}
              className="w-full px-3 py-2 rounded bg-light-surface border border-light-border text-light-text focus:outline-none focus:border-accent dark:bg-navy-950 dark:border-navy-700 dark:text-warm-white"
            />
            {errors[key] && <p className="mt-1 text-sm text-red-400">{errors[key]}</p>}
          </div>
        ))}

        {NUMBER_FIELDS.map((key) => (
          <div key={key} className="mb-4">
            <label htmlFor={`profile-${key}`} className="block text-sm mb-1">
              {t(`profile.fields.${key}`)}
            </label>
            <input
              id={`profile-${key}`}
              type="number"
              value={formData[key] ?? ''}
              onChange={(e) => handleNumberChange(key, e.target.value)}
              className="w-full px-3 py-2 rounded bg-light-surface border border-light-border text-light-text focus:outline-none focus:border-accent dark:bg-navy-950 dark:border-navy-700 dark:text-warm-white"
            />
            {errors[key] && <p className="mt-1 text-sm text-red-400">{errors[key]}</p>}
          </div>
        ))}

        <div className="mb-4">
          <label htmlFor="profile-dietaryRestrictions" className="block text-sm mb-1">
            {t('profile.fields.dietaryRestrictions')}
          </label>
          <input
            id="profile-dietaryRestrictions"
            type="text"
            value={dietaryInput}
            onChange={(e) => setDietaryInput(e.target.value)}
            className="w-full px-3 py-2 rounded bg-navy-950 border border-navy-700 text-warm-white focus:outline-none focus:border-accent"
          />
          {errors.dietaryRestrictions && (
            <p className="mt-1 text-sm text-red-400">{errors.dietaryRestrictions}</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 rounded bg-accent text-navy-950 font-semibold hover:opacity-90 transition-opacity"
        >
          {t('profile.save')}
        </button>
      </form>
    </div>
  );
}
