import { describe, expect, it } from 'vitest';
import { buildSystemPrompt } from './systemPrompt';

describe('buildSystemPrompt', () => {
  it('includes the base persona description', () => {
    const prompt = buildSystemPrompt({});

    expect(prompt).toContain('You are Flex');
    expect(prompt).toContain("You respond in the same language the user writes in.");
  });

  it('includes every profile field when provided', () => {
    const prompt = buildSystemPrompt({
      name: 'Alex',
      age: 30,
      gender: 'female',
      weight: 65,
      goal: 'lose weight',
      activityLevel: 'moderate',
      dietaryRestrictions: ['vegan', 'gluten-free'],
    });

    expect(prompt).toContain('Alex');
    expect(prompt).toContain('30');
    expect(prompt).toContain('female');
    expect(prompt).toContain('65');
    expect(prompt).toContain('lose weight');
    expect(prompt).toContain('moderate');
    expect(prompt).toContain('vegan, gluten-free');
  });

  it('uses default values when the profile is empty', () => {
    const prompt = buildSystemPrompt({});

    expect(prompt).toContain('unknown');
    expect(prompt).toContain('none');
  });

  it('renders "none" for empty dietary restrictions array', () => {
    const prompt = buildSystemPrompt({ dietaryRestrictions: [] });

    expect(prompt).toContain('none');
  });
});
