import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { Profile } from '../schemas/profile.schema';
import { useProfile } from '../hooks/useProfile';

interface StepConfig {
  key: 'age' | 'gender' | 'weight' | 'goal' | 'activityLevel' | 'dietaryRestrictions';
  type: 'number' | 'text';
}

const STEPS: StepConfig[] = [
  { key: 'age', type: 'number' },
  { key: 'gender', type: 'text' },
  { key: 'weight', type: 'number' },
  { key: 'goal', type: 'text' },
  { key: 'activityLevel', type: 'text' },
  { key: 'dietaryRestrictions', type: 'text' },
];

export default function Onboarding() {
  const { t } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [answers, setAnswers] = useState<Partial<Profile>>({});
  const { saveProfile } = useProfile();
  const navigate = useNavigate();

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  const handleNext = async () => {
    let value: Partial<Profile>;

    if (step.type === 'number') {
      const trimmed = inputValue.trim();
      const parsed = trimmed === '' ? undefined : Number(trimmed);
      value = { [step.key]: Number.isNaN(parsed) ? undefined : parsed };
    } else if (step.key === 'dietaryRestrictions') {
      const items = inputValue
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      value = { dietaryRestrictions: items.length > 0 ? items : undefined };
    } else {
      value = { [step.key]: inputValue.trim() || undefined };
    }

    const updated = { ...answers, ...value };
    setAnswers(updated);
    setInputValue('');

    if (isLastStep) {
      await saveProfile(updated);
      navigate('/chat');
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const handleSkip = async () => {
    await saveProfile({ onboardingSkipped: true });
    navigate('/chat');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-8">
      <div className="max-w-md w-full bg-light-bg border border-light-border rounded-lg p-6 text-light-text dark:bg-navy-900 dark:border-navy-700 dark:text-warm-white">
        <h1 className="text-lg font-semibold text-accent mb-3">{t('onboarding.welcome')}</h1>
        <p className="text-sm mb-4">{t(`onboarding.steps.${step.key}.question`)}</p>

        <label htmlFor="onboarding-input" className="block text-sm mb-1">
          {t(`onboarding.steps.${step.key}.label`)}
        </label>
        <input
          id="onboarding-input"
          type={step.type}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full mb-4 px-3 py-2 rounded bg-light-surface border border-light-border text-light-text focus:outline-none focus:border-accent dark:bg-navy-950 dark:border-navy-700 dark:text-warm-white"
        />

        <button
          type="button"
          onClick={handleNext}
          className="w-full mb-2 px-4 py-2 rounded bg-accent text-navy-950 font-semibold hover:opacity-90 transition-opacity"
        >
          {isLastStep ? t('onboarding.submit') : t('onboarding.next')}
        </button>

        <button
          type="button"
          onClick={handleSkip}
          className="w-full px-4 py-2 rounded text-sm border border-light-border hover:border-accent transition-colors dark:border-navy-700"
        >
          {t('onboarding.skip')}
        </button>
      </div>
    </div>
  );
}
