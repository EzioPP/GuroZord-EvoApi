// group.participants.update.ts
import { GroupParticipantsUpdateData } from '@/types/evolution.types';
import logger from '@/lib/logger';
import { Services } from '@/factory';

const WELCOME_MESSAGE = `🚫 PROIBIDO brigas.
🚫 PROIBIDO divulgação de links ou outras streaming.
🚫 PROIBIDO chamar no pv outras integrantes sem o consentimento dela ou para ofendê-la.
🚫 PROIBIDO mandar fotos normais, apenas em VISUALIZAÇÃO ÚNICA.
🚫 PROIBIDO enviar figurinhas, fotos ou qualquer conteúdo com nudez/teor explícito.
✅ O grupo será fechado às 01h e aberto às 10h.
✅ PERMITIDO muita fofoca.

🚨 QUEM QUEBRAR ALGUMA REGRA, SERÁ REMOVIDO SEM AVISO PRÉVIO.
🎀 Aqui é um grupo para vocês virarem amigas, pedir conselhos, opiniões, se divertir e falar sobre meu conteúdo.`;

export async function handleGroupParticipantsUpdate(data: GroupParticipantsUpdateData) {
  const groupId = data.id;

  for (const participant of data.participants) {
    const participantWhatsappId = participant.id;

    if (data.action === 'add') {
      const phoneNumber = participant.phoneNumber.split('@')[0];
      logger.info('New participant joined group', { groupId, phoneNumber });

      await Services.groupService.addMembership(participantWhatsappId, groupId);
      await Services.messageService.sendMessage(
        groupId,
        `Seja bem-vinda! 🎀\n\n${WELCOME_MESSAGE}`,
      );
    }

    if (data.action === 'remove') {
      logger.info('Participant left group', { groupId, participantWhatsappId });
      await Services.groupService.removeMembership(participantWhatsappId, groupId);
    }
  }
}