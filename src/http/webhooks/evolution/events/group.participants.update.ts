// group.participants.update.ts
import { GroupParticipantsUpdateData } from '@/types/evolution.types';
import logger from '@/lib/logger';
import { Services } from '@/factory';

type PendingWelcomeMember = {
  whatsappNumber: string;
  name?: string | null;
};

const pendingWelcomes = new Map<
  string,
  { members: PendingWelcomeMember[]; timer: ReturnType<typeof setTimeout> }
>();

const BATCH_DELAY_MS = 5_000;
const MAX_BATCH_SIZE = 10;    //TODO: make this better

async function flushWelcomes(groupId: string): Promise<void> {
  const entry = pendingWelcomes.get(groupId);
  if (!entry || entry.members.length === 0) return;

  const members = [...entry.members];
  pendingWelcomes.delete(groupId);

  logger.info('Sending batched welcome message', { groupId, count: members.length });

  try {
    const welcomeMsg = await Services.messageTemplateService.buildWelcomeMessage(groupId, members);
    await Services.messageService.sendMessage(groupId, welcomeMsg);
  } catch (err) {
    logger.error('Failed to send batched welcome message', { groupId, err });
  }
}

function scheduleWelcome(groupId: string, member: PendingWelcomeMember): void {
  let entry = pendingWelcomes.get(groupId);

  if (entry) {
    clearTimeout(entry.timer);
    entry.members.push(member);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    entry = { members: [member], timer: undefined as any };
    pendingWelcomes.set(groupId, entry);
  }

  // Flush immediately if we hit the max batch size
  if (entry.members.length >= MAX_BATCH_SIZE) {
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

      await Services.groupService.addMembership(participantWhatsappId, groupId, undefined, phoneNumber);
      const member = await Services.groupService.getUserByWhatsappId(participantWhatsappId).catch(() => null);
      scheduleWelcome(groupId, {
        whatsappNumber: phoneNumber,
        name: member?.name ?? null,
      });
    }

    if (data.action === 'remove') {
      logger.info('Participant left group', { groupId, participantWhatsappId });
      await Services.groupService.removeMembership(participantWhatsappId, groupId);
    }
  }
}