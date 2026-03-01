import logger from '@/lib/logger';
import prisma from '@/lib/prisma';
import { Services } from '@/factory';

const ptBrDateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
});

export const checkGroupInactivity = async (): Promise<void> => {
  try {
    logger.info('Starting inactivity check job');

    const allGroups = await prisma.group.findMany();

    for (const group of allGroups) {
      try {
        // Get warning threshold from config, default to 0 (disabled)
        const warningThreshold = await Services.groupConfigRepository.getConfigWithDefault(
          group.groupId,
          'inactive_warning_days',
          '0',
        );
        const banThreshold = await Services.groupConfigRepository.getConfigWithDefault(
          group.groupId,
          'inactive_ban_days',
          '0',
        );

        const warningDays = parseInt(warningThreshold.value, 10);
        const banDays = parseInt(banThreshold.value, 10);

        // Skip if both features are disabled (0 or negative)
        if (warningDays <= 0 && banDays <= 0) continue;

        const bannedMemberIds = new Set<number>();

        if (banDays > 0) {
          const membersToBan = await Services.groupRepository.getInactiveMembers(group.groupId, banDays);

          if (membersToBan.length > 0) {
            logger.info('Found members to ban due to inactivity', {
              groupId: group.groupId,
              count: membersToBan.length,
              banDays,
            });

            const numbersToBan = membersToBan.map((membership) => membership.member.whatsappNumber);

            try {
              await Services.groupService.banMembersFromGroup(group.whatsappId, numbersToBan);
            } catch (err) {
              logger.error('Failed to ban inactive members in bulk', {
                groupId: group.groupId,
                count: numbersToBan.length,
                err,
              });
              continue;
            }

            const bannedLines = membersToBan.map((membership) => {
              const referenceDate = membership.dtLastMessage ?? membership.dtJoined;
              const referenceLabel = membership.dtLastMessage ? 'Última interação' : 'Entrou em';
              return `@${membership.member.whatsappNumber} - ${referenceLabel}: ${ptBrDateTimeFormatter.format(referenceDate)}`;
            });

            const bannedSummaryMessage = [
              `🚫 Membros removidos por inatividade (${banDays}+ dias):`,
              ...bannedLines,
            ].join('\n');

            await Services.messageService.sendMessage(group.whatsappId, bannedSummaryMessage).catch(
              (err) => {
                logger.error('Failed to send inactivity ban summary', {
                  groupId: group.groupId,
                  count: membersToBan.length,
                  err,
                });
              },
            );

            for (const membership of membersToBan) {
              try {
                await Services.groupService.removeMembership(
                  membership.member.whatsappId,
                  group.whatsappId,
                );
                bannedMemberIds.add(membership.memberId);

                logger.info('Member banned due to inactivity', {
                  groupId: group.groupId,
                  memberId: membership.memberId,
                  banDays,
                });
              } catch (err) {
                logger.error('Failed to mark inactive member as removed after ban', {
                  groupId: group.groupId,
                  memberId: membership.memberId,
                  err,
                });
              }
            }
          }
        }

        if (warningDays <= 0) continue;

        // Find inactive members to warn (excluding already banned members)
        const inactiveMembers = await Services.groupRepository.getInactiveMembers(group.groupId, warningDays);

        const membersToWarn = inactiveMembers.filter(
          (membership) => !bannedMemberIds.has(membership.memberId),
        );

        if (membersToWarn.length === 0) continue;

        logger.info('Found inactive members', {
          groupId: group.groupId,
          count: membersToWarn.length,
          warningDays,
        });

        // Send batched warning messages to avoid spamming
        const batchSize = 10;
        for (let index = 0; index < membersToWarn.length; index += batchSize) {
          const batch = membersToWarn.slice(index, index + batchSize);
          const message = await Services.messageTemplateService.buildInactivityWarningMessage(
            group.whatsappId,
            warningDays,
            batch.map((membership) => ({
              whatsappNumber: membership.member.whatsappNumber,
              dtLastMessage: membership.dtLastMessage,
            })),
          );

          await Services.messageService.sendMessage(group.whatsappId, message).catch((err) => {
            logger.error('Failed to send inactivity warning batch', {
              groupId: group.groupId,
              batchStart: index,
              batchSize: batch.length,
              err,
            });
          });
        }
      } catch (groupErr) {
        logger.error('Error processing group inactivity check', {
          groupId: group.groupId,
          err: groupErr,
        });
      }
    }

    logger.info('Inactivity check job completed');
  } catch (error) {
    logger.error('Inactivity check job failed', { error });
  }
};
