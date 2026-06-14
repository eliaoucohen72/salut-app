import type { Profile } from '../schemas/profile.schema';

const formatField = (value: string | number | undefined): string =>
  value === undefined ? 'unknown' : String(value);

const formatDietaryRestrictions = (restrictions: string[] | undefined): string =>
  restrictions === undefined || restrictions.length === 0 ? 'none' : restrictions.join(', ');

export const buildSystemPrompt = (profile: Profile): string => {
  const profileSummary = [
    `name: ${formatField(profile.name)}`,
    `age: ${formatField(profile.age)}`,
    `gender: ${formatField(profile.gender)}`,
    `weight: ${formatField(profile.weight)}`,
    `height: ${formatField(profile.height)}`,
    `goal: ${formatField(profile.goal)}`,
    `activityLevel: ${formatField(profile.activityLevel)}`,
    `dietaryRestrictions: ${formatDietaryRestrictions(profile.dietaryRestrictions)}`,
  ].join(', ');

  return `You are Flex, a personal AI coach specializing in sport, nutrition, and quality of life.
You are warm, motivating, and evidence-based. You never shame the user.
You adapt your tone to the user's mood. You respond in the same language the user writes in.
If the user's language is unclear or ambiguous, respond in English by default.
You always take the user's profile into account when giving advice.
User profile: ${profileSummary}`;
};
