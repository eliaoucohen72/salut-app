import { describe, it, expect, afterEach } from 'vitest';
import i18n from './index';

describe('i18n configuration', () => {
  afterEach(() => {
    i18n.changeLanguage('fr');
  });

  it("initialise i18n.language avec un code de langue à 2 lettres parmi 'fr', 'en', 'he'", () => {
    expect(['fr', 'en', 'he']).toContain(i18n.language);
  });

  it('i18n.dir() retourne rtl pour he et ltr pour fr/en', () => {
    expect(i18n.dir('he')).toBe('rtl');
    expect(i18n.dir('fr')).toBe('ltr');
    expect(i18n.dir('en')).toBe('ltr');
  });

  it('applique dir="rtl" sur <html> pour he et dir="ltr" pour fr', async () => {
    await i18n.changeLanguage('he');
    expect(document.documentElement.dir).toBe('rtl');

    await i18n.changeLanguage('fr');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('ne plante pas pour une clé de traduction manquante', () => {
    expect(() => i18n.t('clef.qui.nexiste.pas')).not.toThrow();
    expect(typeof i18n.t('clef.qui.nexiste.pas')).toBe('string');
  });

  it('utilise la langue de repli en pour une langue non supportée (AC5)', () => {
    expect(i18n.t('chat.title', { lng: 'fr' })).toBe('Chat');
    expect(i18n.t('chat.title', { lng: 'de' })).toBe('Chat');
    expect(i18n.t('chat.placeholder', { lng: 'de' })).toBe(
      'Chat interface — to be implemented in Story 2.3'
    );
  });
});
