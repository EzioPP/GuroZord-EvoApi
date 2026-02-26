// group.participants.update.ts
import { GroupParticipantsUpdateData } from '@/types/evolution.types';
import logger from '@/lib/logger';
import { Services } from '@/factory';
import { Messages } from '@/lib/messages';

const pendingWelcomes = new Map<string, { phones: string[]; timer: ReturnType<typeof setTimeout> }>();

const BATCH_DELAY_MS = 5_000;
const MAX_BATCH_SIZE = 10;    //TODO: make this better

function buildWelcomeMessage(phones: string[]): string {
  return phones.length === 1 ? Messages.welcome.single() : Messages.welcome.batch(phones);
}

async function flushWelcomes(groupId: string): Promise<void> {
  const entry = pendingWelcomes.get(groupId);
  if (!entry || entry.phones.length === 0) return;

  const phones = [...entry.phones];
  pendingWelcomes.delete(groupId);

  logger.info('Sending batched welcome message', { groupId, count: phones.length });

  try {
    await Services.messageService.sendMessage(groupId, buildWelcomeMessage(phones));
  } catch (err) {
    logger.error('Failed to send batched welcome message', { groupId, err });
  }
}

function scheduleWelcome(groupId: string, phoneNumber: string): void {
  let entry = pendingWelcomes.get(groupId);

  if (entry) {
    clearTimeout(entry.timer);
    entry.phones.push(phoneNumber);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    entry = { phones: [phoneNumber], timer: undefined as any };
    pendingWelcomes.set(groupId, entry);
  }

  // Flush immediately if we hit the max batch size
  if (entry.phones.length >= MAX_BATCH_SIZE) {
    clearTimeout(entry.timer);
    void flushWelcomes(groupId);
    return;
  }

  // Otherwise (re)start the debounce timer
  entry.timer = setTimeout(() => void flushWelcomes(groupId), BATCH_DELAY_MS);
}

export async function handleGroupParticipantsUpdate(data: GroupParticipantsUpdateData) {
  const groupId = data.id;

  for (const participant of data.participants) {
    const participantWhatsappId = participant.id;

    if (data.action === 'add') {
      const phoneNumber = participant.phoneNumber.split('@')[0];
      logger.info('New participant joined group', { groupId, phoneNumber });

      await Services.groupService.addMembership(participantWhatsappId, groupId);
      scheduleWelcome(groupId, phoneNumber);
    }

    if (data.action === 'remove') {
      logger.info('Participant left group', { groupId, participantWhatsappId });
      await Services.groupService.removeMembership(participantWhatsappId, groupId);
    }
  }
}