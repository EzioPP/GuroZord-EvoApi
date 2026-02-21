import { PrismaClient } from "../../../generated/prisma/client";
import logger from "@/lib/logger";
import { ErrorHandler } from "@/lib/error-handler";
import { NotFoundError } from "@/lib/errors";

export class RankingRepository {
	constructor(private prisma: PrismaClient) {}

	async findAll() {
		try {
			logger.debug("Repository: Fetching all members");
			return await this.prisma.member.findMany();
		} catch (error) {
			throw ErrorHandler.handle(error, logger, { operation: "findAll" });
		}
	}

	async findById(memberId: number) {
		try {
			logger.debug("Repository: Fetching member by ID", { memberId });
			const member = await this.prisma.member.findUnique({
				where: { memberId: memberId },
			});

			if (!member) {
				throw new NotFoundError("Member not found", { memberId });
			}

			return member;
		} catch (error) {
			throw ErrorHandler.handle(error, logger, { operation: "findById", memberId });
		}
	}

	async findWithRank(memberId: number) {
		try {
			logger.debug("Repository: Fetching member with ranking", { memberId });
			const member = await this.prisma.member.findUnique({
				where: { memberId: memberId },
				include: { memberships: true },
			});

			if (!member) {
				throw new NotFoundError("Member not found", { memberId });
			}

			return member;
		} catch (error) {
			throw ErrorHandler.handle(error, logger, { operation: "findWithRank", memberId });
		}
	}
}
