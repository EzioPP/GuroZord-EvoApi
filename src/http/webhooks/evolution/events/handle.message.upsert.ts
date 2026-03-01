import { EvolutionMessageData } from '@/types/evolution.types';
import logger from '@/lib/logger';
import { Services } from '@/factory';
import { ConfigSchema, InactivityConfigSchema } from '@/types/group.types';
import { env } from '../../../../config/env';
import { DEFAULT_TEMPLATES, FANCY_PRESET } from '../../../../services/message-template.service';

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

  if (!message) return;

  const msg = message.trim().toLowerCase();

  if (groupWhatsappId) {
    await Services.groupService.incrementMessageCount(senderId, groupWhatsappId).catch(() => null);
  }

  if (!msg.startsWith('/')) return;

  const isAdmin = env.NODE_ENV !== 'development' || senderId === env.TEST_WHATSAPP_NUMBER;

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
  const topMessage = await Services.messageTemplateService.buildTopMessage(groupWhatsappId, topMembers);
  await Services.messageService.sendMessage(replyTo, topMessage);
}
  logger.info('Received command', { senderId, groupWhatsappId, command: msg });
  if (!isAdmin) return;

  if (msg.startsWith('/get groups')) {
    const groups = await Services.groupService.getAllGroupsWhatsapp();
    const groupNames = groups.map((g) => g.name).join(', ');
    await Services.messageService.sendMessage(senderId, `Groups: ${groupNames}`);
  }

  if (msg.startsWith('/get all settings')) {
    const groups = await Services.groupService.getAllGroupsWithConfigs();
    const getConfig = (
      configs: { key: string; value: string }[],
      key: string,
      defaultValue: string = 'N/A',
    ) => configs.find((c) => c.key === key)?.value ?? defaultValue;
    await Services.messageService.sendMessage(
      senderId,
      `Groups:\n${groups
        .map(
          (g) =>
            `- ${g.name} (WhatsApp ID: ${g.whatsappId})\n  Open Time: ${getConfig(g.groupConfigs, 'open_time')}\n  Close Time: ${getConfig(g.groupConfigs, 'close_time')}\n  Inactivity Warn Days: ${getConfig(g.groupConfigs, 'inactive_warning_days', '0')}\n  Inactivity Ban Days: ${getConfig(g.groupConfigs, 'inactive_ban_days', '0')}`,
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

  if (msg.startsWith('/inactivity_config')) {
    const parts = message.trim().split(/\s+/);
    if (parts.length < 4) {
      await Services.messageService.sendMessage(
        senderId,
        'Invalid format. Use: /inactivity_config [group-name] [warn-days] [ban-days]\nExample: /inactivity_config mygroup 3 7\nSet to 0 to disable warnings or bans (default)',
      );
      return;
    }

    const groupName = parts
      .slice(1, parts.length - 2)
      .join(' ')
      .replace(/^["']|["']$/g, '');
    const warnDays = parts[parts.length - 2];
    const banDays = parts[parts.length - 1];

    const parsed = InactivityConfigSchema.safeParse({
      groupName,
      warnDays,
      banDays,
    });

    if (!parsed.success) {
      await Services.messageService.sendMessage(
        senderId,
        'Invalid format. Use: /inactivity_config [group-name] [warn-days] [ban-days]\nExample: /inactivity_config mygroup 3 7\nDays must be numbers (0 to disable).',
      );
      return;
    }

    const ownedGroup = await Services.groupService.getOwnedGroupByMemberAndGroupName(
      senderId,
      groupName,
    );
    if (!ownedGroup) {
      await Services.messageService.sendMessage(
        senderId,
        `You are not the owner of the group "${groupName}" or it does not exist.`,
      );
      return;
    }

    const isGroupAdmin = await Services.groupService.isMemberAdmin(senderId, ownedGroup.groupId);
    if (!isGroupAdmin) {
      await Services.messageService.sendMessage(
        senderId,
        `You must be an administrator of the group "${ownedGroup.name}" to change inactivity settings.`,
      );
      return;
    }

    await Services.groupConfigRepository.upsertConfig(
      ownedGroup.groupId,
      'inactive_warning_days',
      warnDays,
    );
    await Services.groupConfigRepository.upsertConfig(
      ownedGroup.groupId,
      'inactive_ban_days',
      banDays,
    );

    const warningStatus =
      parseInt(warnDays, 10) === 0
        ? 'disabled'
        : `${warnDays} days`;
    const banStatus = parseInt(banDays, 10) === 0 ? 'disabled' : `${banDays} days`;
    const statusMsg =
      `Inactivity settings updated for "${ownedGroup.name}".\n` +
      `Warning threshold: ${warningStatus}\n` +
      `Ban threshold: ${banStatus}`;
    await Services.messageService.sendMessage(senderId, statusMsg);
  }

  if (msg.startsWith('/preset')) {
    const parts = message.trim().split(/\s+/);
    if (parts.length < 3) {
      await Services.messageService.sendMessage(
        senderId,
        'Invalid format. Use: /preset [group-name] [preset]\nExample: /preset mygroup fancy\nAvailable presets: basic, fancy',
      );
      return;
    }

    const groupName = parts
      .slice(1, parts.length - 1)
      .join(' ')
      .replace(/^["']|["']$/g, '');
    const presetName = parts[parts.length - 1].toLowerCase();

    const presetByName: Record<string, Record<string, string>> = {
      basic: DEFAULT_TEMPLATES,
      default: DEFAULT_TEMPLATES,
      fancy: FANCY_PRESET,
    };

    const preset = presetByName[presetName];
    if (!preset) {
      await Services.messageService.sendMessage(
        senderId,
        `Unknown preset "${presetName}". Available presets: basic, fancy`,
      );
      return;
    }

    const ownedGroup = await Services.groupService.getOwnedGroupByMemberAndGroupName(
      senderId,
      groupName,
    );
    if (!ownedGroup) {
      await Services.messageService.sendMessage(
        senderId,
        `You are not the owner of the group "${groupName}" or it does not exist.`,
      );
      return;
    }

    const isGroupAdmin = await Services.groupService.isMemberAdmin(senderId, ownedGroup.groupId);
    if (!isGroupAdmin) {
      await Services.messageService.sendMessage(
        senderId,
        `You must be an administrator of the group "${ownedGroup.name}" to apply message presets.`,
      );
      return;
    }

    await Services.messageTemplateService.applyPreset(ownedGroup.whatsappId, preset);
    await Services.messageService.sendMessage(
      senderId,
      `Preset "${presetName}" applied to "${ownedGroup.name}".`,
    );
  }
}
