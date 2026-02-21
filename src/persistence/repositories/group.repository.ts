import { PrismaClient } from "@@/generated/prisma/client";
import logger from "@/lib/logger";
import { ErrorHandler } from "@/lib/error-handler";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { GroupUpdateInput } from "@/types/repository.types";

export class GroupRepository {
	constructor(private prisma: PrismaClient) {}

	async findGroupSettings(groupId: number) {
		try {
			logger.debug("Repository: Fetching group settings", { groupId });

			if (!groupId) {
				throw new ValidationError("Group ID is required", { groupId });
			}

			const group = await this.prisma.group.findUnique({
				where: { groupId: groupId },
			});

			if (!group) {
				throw new NotFoundError("Group not found", { groupId });
			}

			return group;
		} catch (error) {
			throw ErrorHandler.handle(error, logger, { operation: "findGroupSettings", groupId });
		}
	}

	async updateGroupSettings(groupId: number, data: GroupUpdateInput) {
		try {

            const group = await this.prisma.group.findUnique({
                where: { groupId: groupId },
            });
            if (!group) {
                throw new NotFoundError("Group not found", { groupId });
            }
			logger.debug("Repository: Updating group settings", { groupId });
			return await this.prisma.group.update({
				where: { groupId: groupId },
				data,
			});
		} catch (error) {
			throw ErrorHandler.handle(error, logger, {
				operation: "updateGroupSettings",
				groupId,
			});
		}
	}

	async createWithDefaultSettings(name: string, whatsappId: string) {
		try {
			if (!name) {
				throw new ValidationError("Group name is required", { name });
			}

			logger.debug("Repository: Creating default group settings", { name });
			return await this.prisma.group.create({
				data: {
					name,
					whatsappId,
					openTime: "09:00",
					closeTime: "17:00",
				},
			});
		} catch (error) {
			throw ErrorHandler.handle(error, logger, {
				operation: "createWithDefaultSettings",
				name,
				whatsappId,
			});
		}
	}
}
