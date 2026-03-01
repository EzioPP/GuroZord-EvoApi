// factory/services.ts
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import { RankingService } from '@/services/ranking.service';
import { GroupService } from '@/services/group.service';
import { MessageService } from '@/services/message.service';
import { MessageTemplateService } from '@/services/message-template.service';
import { RankingRepository, GroupRepository, GroupConfigRepository } from '@/persistence';
import { EvolutionClient } from '@/clients/evolution.client';

const evolutionClient = new EvolutionClient();

export const createRankingService = (): RankingService => {
  const rankingRepository = new RankingRepository(prisma);
  return new RankingService(rankingRepository, logger);
};

export const createGroupService = (): GroupService => {
  const groupRepository = new GroupRepository(prisma);
  const groupConfigRepository = new GroupConfigRepository(prisma);
  return new GroupService(groupRepository, groupConfigRepository, evolutionClient, logger);
};

export const createMessageService = (): MessageService => {
  return new MessageService(evolutionClient, logger);
};

export const createMessageTemplateService = (): MessageTemplateService => {
  const groupRepository = new GroupRepository(prisma);
  const groupConfigRepository = new GroupConfigRepository(prisma);
  return new MessageTemplateService(groupRepository, groupConfigRepository, logger);
};

export const Services = {
  rankingService: createRankingService(),
  groupService: createGroupService(),
  messageService: createMessageService(),
  messageTemplateService: createMessageTemplateService(),
  groupConfigRepository: new GroupConfigRepository(prisma),
  groupRepository: new GroupRepository(prisma),
};
