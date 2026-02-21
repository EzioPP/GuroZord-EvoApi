import type { GroupModel } from "../../generated/prisma/models/Group";
import type { MemberModel } from "../../generated/prisma/models/Member";

/**
 * Repository types for GroupRepository
 */
export type GroupSettings = Partial<Omit<GroupModel, "id" | "createdAt" | "updatedAt">>;
export type GroupUpdateInput = Partial<GroupSettings>;

/**
 * Repository types for RankingRepository
 */
export type MemberWithRanking = MemberModel & {
	memberships?: any[];
};

/**
 * Common types
 */
export type RepositoryContext = Record<string, string | number | boolean | undefined>;
