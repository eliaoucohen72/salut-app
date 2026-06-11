import type { Profile } from '../schemas/profile.schema';
import type { Conversation } from '../types';

export interface StorageRepository {
  getProfile(): Promise<Profile | null>;
  saveProfile(profile: Profile): Promise<void>;
  listConversations(): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | null>;
  saveConversation(conversation: Conversation): Promise<void>;
  deleteConversation(id: string): Promise<void>;
  getDisclaimerAcknowledged(): Promise<boolean>;
  setDisclaimerAcknowledged(): Promise<void>;
}
