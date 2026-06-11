import type { StorageRepository } from './StorageRepository';
import type { Profile } from '../schemas/profile.schema';
import { ProfileSchema } from '../schemas/profile.schema';
import type { Conversation } from '../types';

const PROFILE_KEY = 'coach_profile';
const CONVERSATIONS_KEY = 'coach_conversations';
const DISCLAIMER_KEY = 'coach_disclaimer_acknowledged';

export class LocalStorageRepository implements StorageRepository {
  async getProfile(): Promise<Profile | null> {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Profile;
  }

  async saveProfile(profile: Profile): Promise<void> {
    const parsed = ProfileSchema.parse(profile);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(parsed));
  }

  async listConversations(): Promise<Conversation[]> {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Conversation[];
  }

  async getConversation(id: string): Promise<Conversation | null> {
    const conversations = await this.listConversations();
    return conversations.find((c) => c.id === id) ?? null;
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    const conversations = await this.listConversations();
    const index = conversations.findIndex((c) => c.id === conversation.id);
    const updated = index >= 0
      ? conversations.map((c) => (c.id === conversation.id ? conversation : c))
      : [...conversations, conversation];
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(updated));
  }

  async deleteConversation(id: string): Promise<void> {
    const conversations = await this.listConversations();
    const updated = conversations.filter((c) => c.id !== id);
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(updated));
  }

  async getDisclaimerAcknowledged(): Promise<boolean> {
    return localStorage.getItem(DISCLAIMER_KEY) === 'true';
  }

  async setDisclaimerAcknowledged(): Promise<void> {
    localStorage.setItem(DISCLAIMER_KEY, 'true');
  }
}

export const localStorageRepository = new LocalStorageRepository();
