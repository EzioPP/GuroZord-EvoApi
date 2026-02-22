import { EvolutionMessageData } from '@/types/evolution.types';
import logger from '@/lib/logger';
import { Services } from '@/factory';
import { ConfigSchema } from '@/types/group.types';

export async function handleMessagesUpsert(data: EvolutionMessageData) {
  if (data.key.fromMe) return;
  const senderId = data.key.remoteJid;
  const message = data.message?.conversation;
  const senderNumber = senderId.split('@')[0];
  logger.info('Extracted sender number', { senderNumber });
  if (!message) {
    return;
  }
  if (process.env.NODE_ENV === 'development') {
    if (senderId !== process.env.TEST_WHATSAPP_NUMBER) {
      logger.info('Ignoring message from non-test number in development', { senderId });
      return;
    }
  }
  if (message.includes('hello')) {
    logger.info('Message contains "hello"', { message });
    const responseMessage = 'world';
    await Services.messageService.sendMessage(senderNumber, responseMessage);
  }
  if (message.includes('get groups')) {
    logger.info('Message contains "get groups"', { message });
    const groups = await Services.groupService.getAllGroupsWhatsapp();
    const groupNames = groups.map((g) => g.name).join(', ');
    const responseMessage = `Groups: ${groupNames}`;
    await Services.messageService.sendMessage(senderNumber, responseMessage);
  }
  if (message.includes('sync')) {
    logger.info('Message contains "sync groups"', { message });
    await Services.groupService.syncGroups();
    await Services.messageService.sendMessage(senderNumber, 'Groups synchronized.');
  }if (message.includes('config')) {
  const parts = message.split(' ');
  // parts[0] = 'config', parts[1] = group name, parts[2] = openTime, parts[3] = closeTime

  const result = ConfigSchema.safeParse({
    groupName: parts[1],
    openTime: parts[2],
    closeTime: parts[3],
  });

  if (!result.success) {
    await Services.messageService.sendMessage(
      senderNumber,
      'Formato inválido. Use: config <nome_do_grupo> HH:MM HH:MM\nExemplo: config meugrupo 09:00 17:00',
    );
    return;
  }

  // Check ownership of that specific group
  const ownedGroup = await Services.groupService.getOwnedGroupByMemberAndGroupName(
    senderId,
    result.data.groupName,
  );

  if (!ownedGroup) {
    await Services.messageService.sendMessage(
      senderNumber,
      `Você não é o proprietário do grupo "${result.data.groupName}" ou ele não existe.`,
    );
    return;
  }

  const { openTime, closeTime } = result.data;
  await Services.groupService.changeOpenCloseTimes(ownedGroup.groupId, openTime, closeTime);

  await Services.messageService.sendMessage(
    senderNumber,
    `Configurações atualizadas para "${ownedGroup.name}". Abertura: ${openTime}, Fechamento: ${closeTime}`,
  );
}
}
