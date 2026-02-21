import prisma from "@/lib/prisma";
import logger from "@/lib/logger";
import { RankingService } from "@/services/ranking.service";
import { GroupService } from "@/services/group.service";
import { RankingRepository, GroupRepository } from "@/persistence";

export const createRankingService = (): RankingService => {
	const rankingRepository = new RankingRepository(prisma);
	return new RankingService(rankingRepository, logger);
};

export const createGroupService = (): GroupService => {
	const groupRepository = new GroupRepository(prisma);
	return new GroupService(groupRepository, logger);
};
