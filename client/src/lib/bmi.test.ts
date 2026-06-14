import { describe, it, expect } from 'vitest';
import { calculateBmi, getBmiCategory } from './bmi';

describe('calculateBmi', () => {
  it('calcule le BMI à partir du poids (kg) et de la taille (cm)', () => {
    expect(calculateBmi(70, 175)).toBeCloseTo(22.86, 2);
  });
});

describe('getBmiCategory', () => {
  it('retourne underweight pour un BMI < 18.5', () => {
    expect(getBmiCategory(17)).toBe('underweight');
  });

  it('retourne normal pour un BMI entre 18.5 et 25', () => {
    expect(getBmiCategory(22)).toBe('normal');
  });

  it('retourne overweight pour un BMI entre 25 et 30', () => {
    expect(getBmiCategory(27)).toBe('overweight');
  });

  it('retourne obese pour un BMI >= 30', () => {
    expect(getBmiCategory(32)).toBe('obese');
  });
});
