import { describe, it, expect } from 'vitest';
import { ProfileSchema } from './profile.schema';

describe('ProfileSchema', () => {
  it('accepte un objet vide (tous les champs sont optionnels)', () => {
    expect(() => ProfileSchema.parse({})).not.toThrow();
  });

  it('lève une ZodError si un champ a un type invalide', () => {
    expect(() => ProfileSchema.parse({ age: 'invalid' })).toThrow();
  });

  it('lève une ZodError si age est négatif ou nul', () => {
    expect(() => ProfileSchema.parse({ age: -1 })).toThrow();
    expect(() => ProfileSchema.parse({ age: 0 })).toThrow();
  });

  it('lève une ZodError si weight est négatif ou nul', () => {
    expect(() => ProfileSchema.parse({ weight: -5 })).toThrow();
    expect(() => ProfileSchema.parse({ weight: 0 })).toThrow();
  });

  it('accepte age et weight positifs ou undefined', () => {
    expect(() => ProfileSchema.parse({ age: 30, weight: 65 })).not.toThrow();
    expect(() => ProfileSchema.parse({ age: undefined, weight: undefined })).not.toThrow();
  });
});
