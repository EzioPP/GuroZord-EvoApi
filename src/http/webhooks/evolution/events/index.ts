import { handleMessagesUpsert } from './handle.message.upsert';
import { handleGroupParticipantsUpdate } from './group.participants.update';
import { AnyEvolutionWebhook } from '@/types/evolution.types';

type EventHandler = (data: AnyEvolutionWebhook['data']) => Promise<void>;

export const eventHandlers: Record<string, EventHandler> = {
  'messages.upsert': handleMessagesUpsert as EventHandler,
  'group-participants.update': handleGroupParticipantsUpdate as EventHandler,
};