import { EvolutionMessageData } from '@/types/evolution.types';
import logger from '@/lib/logger';
import { Services } from '@/factory';
import { ConfigSchema } from '@/types/group.types';
export async function handleMessagesUpsert(data: EvolutionMessageData) {
  if (data.key.fromMe) return;
  logger.info('Handling messages.upsert event', { data});
  const isGroupMessage = data.key.remoteJid.endsWith('@g.us');
  const groupWhatsappId = isGroupMessage ? data.key.remoteJid : null;
  const senderId = isGroupMessage
    ? (data.key.participant ?? data.key.remoteJid)
    : data.key.remoteJid;
  const senderNumber = senderId.split('@')[0];
  const message = data.message?.conversation;

  logger.info('Extracted sender', { senderNumber, isGroupMessage, groupWhatsappId });
  if (!message) return;

  const msg = message.trim().toLowerCase();

  const isAdmin =
    process.env.NODE_ENV !== 'development' || senderId === process.env.TEST_WHATSAPP_NUMBER;

  if (groupWhatsappId) {
    await Services.groupService
      .incrementMessageCount(senderId, groupWhatsappId)
      .catch(() => null);
  }

  if (msg.startsWith('hello')) {
    await Services.messageService.sendMessage(senderNumber, 'world');
  }
  if (msg.startsWith('whoami')) {
    await Services.messageService.sendMessage(senderNumber, `You are ${senderNumber}`);
  }
  if (msg.startsWith('gurozord')) {
    await Services.messageService.sendMessage(
      senderNumber,
      'Do caos veio a ordem! Sou um bot de moderação criado pelo Guro, automatize suas ideias!\nguronaive.com',
    );
  }

  if (!isAdmin) return;

  if (msg.startsWith('get groups')) {
    const groups = await Services.groupService.getAllGroupsWhatsapp();
    const groupNames = groups.map((g) => g.name).join(', ');
    await Services.messageService.sendMessage(senderNumber, `Groups: ${groupNames}`);
  }
  if (msg.startsWith('sync')) {
    await Services.groupService.syncGroups();
    await Services.messageService.sendMessage(senderNumber, 'Groups synchronized.');
  }
  if (msg.startsWith('config')) {
    const parts = message.trim().split(/\s+/);

    if (parts.length < 4) {
      await Services.messageService.sendMessage(
        senderNumber,
        'Invalid format. Use: config <group_name> HH:MM HH:MM\nExample: config mygroup 09:00 17:00',
      );
      return;
    }

    const groupName = parts
      .slice(1, parts.length - 2)
      .join(' ')
      .replace(/^["']|["']$/g, '');
    const openTime = parts[parts.length - 2];
    const closeTime = parts[parts.length - 1];

    const result = ConfigSchema.safeParse({ groupName, openTime, closeTime });

    if (!result.success) {
      await Services.messageService.sendMessage(
        senderNumber,
        'Invalid format. Use: config <group_name> HH:MM HH:MM\nExample: config mygroup 09:00 17:00',
      );
      return;
    }

    const ownedGroup = await Services.groupService.getOwnedGroupByMemberAndGroupName(
      senderId,
      result.data.groupName,
    );

    if (!ownedGroup) {
      await Services.messageService.sendMessage(
        senderNumber,
        `You are not the owner of the group "${result.data.groupName}" or it does not exist.`,
      );
      return;
    }

    const isGroupAdmin = await Services.groupService.isMemberAdmin(senderId, ownedGroup.groupId);
    if (!isGroupAdmin) {
      await Services.messageService.sendMessage(
        senderNumber,
        `You must be an administrator of the group "${ownedGroup.name}" to change the open/close times.`,
      );
      return;
    }

    await Services.groupService.changeOpenCloseTimes(ownedGroup.groupId, openTime, closeTime);
    await Services.messageService.sendMessage(
      senderNumber,
      `Settings updated for "${ownedGroup.name}". Open: ${openTime}, Close: ${closeTime}`,
    );
  }
}