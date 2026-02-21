import { EvolutionMessageData } from '@/types/evolution.types';
import logger from '@/lib/logger';

export async function handleMessagesUpsert(data: EvolutionMessageData) {
  const senderId = data.key.remoteJid;
  logger.info('Received messages.upsert', { data, senderId });
  
}