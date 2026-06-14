import { z } from 'zod';

export const ProfileSchema = z.object({
  name: z.string().optional(),
  age: z.number().positive().optional(),
  gender: z.string().optional(),
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  goal: z.string().optional(),
  activityLevel: z.string().optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  language: z.string().optional(),
  onboardingSkipped: z.boolean().optional(),
});

export type Profile = z.infer<typeof ProfileSchema>;
