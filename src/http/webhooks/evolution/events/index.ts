import { handleMessagesUpsert } from './handle.message.upsert';
import { EvolutionMessageData } from '@/types/evolution.types';

export const eventHandlers: Record<string, (data: EvolutionMessageData) => Promise<void>> = {
  'messages.upsert': handleMessagesUpsert,
};
