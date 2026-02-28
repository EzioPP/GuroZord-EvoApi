import { EvolutionMessageData } from '@/types/evolution.types';
import logger from '@/lib/logger';
import { Services } from '@/factory';
import { ConfigSchema } from '@/types/group.types';
import { Messages } from '@/lib/messages';

export async function handleMessagesUpsert(data: EvolutionMessageData) {
  if (data.key.fromMe) return;
  const isGroupMessage = data.key.remoteJid.endsWith('@g.us');
  const groupWhatsappId = isGroupMessage ? data.key.remoteJid : null;
  const senderId = isGroupMessage
    ? (data.key.participant ?? data.key.remoteJid)
    : data.key.remoteJid;
  const senderNumber = senderId.split('@')[0];
  const replyTo = groupWhatsappId ?? senderId;
  const message = data.message?.conversation;

  logger.info('Extracted sender', { senderNumber, isGroupMessage, groupWhatsappId });

  if (!message) return;

  const msg = message.trim().toLowerCase();

  if (groupWhatsappId) {
    await Services.groupService.incrementMessageCount(senderId, groupWhatsappId).catch(() => null);
  }

  if (!msg.startsWith('/')) return;

  const isAdmin =
    process.env.NODE_ENV !== 'development' || senderId === process.env.TEST_WHATSAPP_NUMBER;

  if (msg.startsWith('/hello')) {
    await Services.messageService.sendMessage(replyTo, 'world');
  }

  if (msg.startsWith('/whoami')) {
    await Services.messageService.sendMessage(replyTo, `You are ${senderNumber}`);
  }

  if (msg.startsWith('/gurozord')) {
    await Services.messageService.sendMessage(
      replyTo,
      'Do caos veio a ordem! Sou um bot de moderação criado pelo Guro, automatize suas ideias!\nguronaive.com',
    );
  }
if (msg.startsWith('/top')) {
  if (!groupWhatsappId) return;
  const topMembers = await Services.groupService.getTopActiveMembers(groupWhatsappId, 10);
  if (topMembers.length === 0) {
    await Services.messageService.sendMessage(replyTo, Messages.top.empty);
    return;
  }
  await Services.messageService.sendMessage(replyTo, Messages.top.build(topMembers));
}
  if (!isAdmin) return;

  if (msg.startsWith('/get groups')) {
    const groups = await Services.groupService.getAllGroupsWhatsapp();
    const groupNames = groups.map((g) => g.name).join(', ');
    await Services.messageService.sendMessage(senderId, `Groups: ${groupNames}`);
  }

  if (msg.startsWith('/get all settings')) {
    const groups = await Services.groupService.getAllGroups()
    await Services.messageService.sendMessage(
      senderId,
      `Groups:\n${groups
        .map(
          (g) =>
            `- ${g.name} (WhatsApp ID: ${g.whatsappId})\n  Open Time: ${g.openTime}\n  Close Time: ${g.closeTime}`,
        )
        .join('\n\n')}`,
    );
  }
  if (msg.startsWith('/sync')) {
    try {
      await Services.groupService.syncGroups();
      logger.info('Groups synchronized by command', { senderId });
      await Services.messageService.sendMessage(senderId, 'Groups synchronized.');
    } catch (err) {
      logger.error('Failed to synchronize groups', { senderId, err });
      await Services.messageService.sendMessage(
        senderId,
        'Failed to synchronize groups. Please try again later.',
      );
    }
  }

  if (msg.startsWith('/config')) {
    const parts = message.trim().split(/\s+/);
    if (parts.length < 4) {
      await Services.messageService.sendMessage(
        senderId,
        'Invalid format. Use: /config HH:MM HH:MM\nExample: /config mygroup 09:00 17:00',
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
        senderId,
        'Invalid format. Use: /config HH:MM HH:MM\nExample: /config mygroup 09:00 17:00',
      );
      return;
    }

    const ownedGroup = await Services.groupService.getOwnedGroupByMemberAndGroupName(
      senderId,
      result.data.groupName,
    );
    if (!ownedGroup) {
      await Services.messageService.sendMessage(
        senderId,
        `You are not the owner of the group "${result.data.groupName}" or it does not exist.`,
      );
      return;
    }

    const isGroupAdmin = await Services.groupService.isMemberAdmin(senderId, ownedGroup.groupId);
    if (!isGroupAdmin) {
      await Services.messageService.sendMessage(
        senderId,
        `You must be an administrator of the group "${ownedGroup.name}" to change the open/close times.`,
      );
      return;
    }

    await Services.groupService.changeOpenCloseTimes(ownedGroup.groupId, openTime, closeTime);
    await Services.messageService.sendMessage(
      senderId,
      `Settings updated for "${ownedGroup.name}". Open: ${openTime}, Close: ${closeTime}`,
    );
  }
}
