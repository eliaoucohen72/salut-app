import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageRepository } from './LocalStorageRepository';
import type { Conversation } from '../types';

describe('LocalStorageRepository', () => {
  let repo: LocalStorageRepository;

  beforeEach(() => {
    localStorage.clear();
    repo = new LocalStorageRepository();
  });

  describe('profile', () => {
    it('saveProfile puis getProfile retourne le même profil', async () => {
      const profile = { name: 'Alice', age: 30 };
      await repo.saveProfile(profile);
      const result = await repo.getProfile();
      expect(result).toEqual(profile);
    });

    it("getProfile retourne null quand localStorage est vide", async () => {
      const result = await repo.getProfile();
      expect(result).toBeNull();
    });

    it('saveProfile avec un profil invalide lève une erreur et n\'écrit rien', async () => {
      const invalidProfile = { age: 'trente' } as unknown as Parameters<
        typeof repo.saveProfile
      >[0];

      await expect(repo.saveProfile(invalidProfile)).rejects.toThrow();
      expect(localStorage.getItem('coach_profile')).toBeNull();
    });
  });

  describe('conversations', () => {
    const conversation: Conversation = {
      id: '1',
      title: 'Conversation 1',
      messages: [{ role: 'user', content: 'Bonjour' }],
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    it('saveConversation puis getConversation retourne la même conversation', async () => {
      await repo.saveConversation(conversation);
      const result = await repo.getConversation('1');
      expect(result).toEqual(conversation);
    });

    it('listConversations retourne toutes les conversations sauvegardées', async () => {
      await repo.saveConversation(conversation);
      const result = await repo.listConversations();
      expect(result).toEqual([conversation]);
    });

    it("getConversation retourne null si l'id n'existe pas", async () => {
      const result = await repo.getConversation('inconnu');
      expect(result).toBeNull();
    });

    it('deleteConversation supprime la conversation correspondante', async () => {
      await repo.saveConversation(conversation);
      await repo.deleteConversation('1');
      const result = await repo.listConversations();
      expect(result).toEqual([]);
    });
  });

  describe('disclaimer', () => {
    it('getDisclaimerAcknowledged retourne false quand le flag est absent', async () => {
      const result = await repo.getDisclaimerAcknowledged();
      expect(result).toBe(false);
    });

    it('getDisclaimerAcknowledged retourne true après setDisclaimerAcknowledged', async () => {
      await repo.setDisclaimerAcknowledged();
      const result = await repo.getDisclaimerAcknowledged();
      expect(result).toBe(true);
    });
  });
});
