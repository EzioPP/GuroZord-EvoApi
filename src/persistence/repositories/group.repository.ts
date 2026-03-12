import { PrismaClient } from '@@/generated/prisma/client';
import logger from '@/lib/logger';
import { ErrorHandler } from '@/lib/error-handler';
import { NotFoundError } from '@/lib/errors';
import { env } from '@/config/env';
import type { GroupUpdateInput } from '@/types/repository.types';
import { getPeriodStart } from '@/lib/period-utils';

const normalizeWhatsappNumber = (value?: string): string | undefined => {
  if (!value) return undefined;
  const numberPart = value.split('@')[0];
  const digits = numberPart.replace(/\D/g, '');
  return digits || undefined;
};

const botWhatsappNumber = normalizeWhatsappNumber(env.BOT_WHATSAPP_NUMBER);

export class GroupRepository {
  constructor(private prisma: PrismaClient) {}

  async findGroupSettings(groupId: number) {
    try {
      logger.debug('Repository: Fetching group settings', { groupId });
      const group = await this.prisma.group.findUnique({ where: { groupId } });
      if (!group) throw new NotFoundError('Group not found', { groupId });
      return group;
    } catch (error) {
      throw ErrorHandler.handle(error, logger, { operation: 'findGroupSettings', groupId });
    }
  }

  async getGroupById(groupId: number) {
    try {
      logger.debug('Repository: Getting group by ID', { groupId });
      const group = await this.prisma.group.findUnique({ where: { groupId } });
      if (!group) throw new NotFoundError('Group not found', { groupId });
      return group;
    } catch (error) {
      throw ErrorHandler.handle(error, logger, { operation: 'getGroupById', groupId });
    }
  }

  async getGroupByWhatsappId(whatsappId: string) {
    try {
      logger.debug('Repository: Getting group by WhatsApp ID', { whatsappId });
      const group = await this.prisma.group.findUnique({ where: { whatsappId } });
      if (!group) throw new NotFoundError('Group not found', { whatsappId });
      return group;
    } catch (error) {
      throw ErrorHandler.handle(error, logger, { operation: 'getGroupByWhatsappId', whatsappId });
    }
  }

  async getRegisteredOwners(groupId: number) {
    try {
      logger.debug('Repository: Fetching registered group owners', { groupId });
      return await this.prisma.membership.findMany({
        where: { groupId, isOwner: true },
        include: { member: true },
      });
    } catch (error) {
      throw ErrorHandler.handle(error, logger, { operation: 'getRegisteredOwners', groupId });
    }
  }

  async updateGroupSettings(groupId: number, data: GroupUpdateInput) {
    try {
      logger.debug('Repository: Updating group settings', { groupId });
      const group = await this.prisma.group.findUnique({ where: { groupId } });
      if (!group) throw new NotFoundError('Group not found', { groupId });
      return await this.prisma.group.update({ where: { groupId }, data });
    } catch (error) {
      throw ErrorHandler.handle(error, logger, { operation: 'updateGroupSettings', groupId });
    }
  }

  async getOwnedGroupByMemberWhatsappId(whatsappId: string) {
    try {
      logger.debug('Repository: Fetching owned group by member WhatsApp ID', { whatsappId });
      const membership = await this.prisma.membership.findFirst({
        where: { member: { whatsappId }, isOwner: true },
        include: { group: true },
      });
      return membership?.group ?? null;
    } catch (error) {
      throw ErrorHandler.handle(error, logger, {
        operation: 'getOwnedGroupByMemberWhatsappId',
        whatsappId,
      });
    }
  }

  async getOwnedGroupByMemberAndGroupName(whatsappId: string, groupName: string) {
    try {
      const membership = await this.prisma.membership.findFirst({
        where: {
          isAdmin: true,
          member: {
            OR: [{ whatsappId }, { whatsappLid: whatsappId }],
          },
          group: { name: { contains: groupName, mode: 'insensitive' } },
        },
        include: { group: true },
      });
      return membership?.group ?? null;
    } catch (error) {
      throw ErrorHandler.handle(error, logger, {
        operation: 'getOwnedGroupByMemberAndGroupName',
        whatsappId,
        groupName,
      });
    }
  }

  async getMembershipByWhatsappIdAndGroup(whatsappId: string, groupId: number) {
    try {
      return await this.prisma.membership.findFirst({
        where: {
          member: {
            OR: [{ whatsappId }, { whatsappLid: whatsappId }],
          },
          groupId,
        },
      });
    } catch (error) {
      throw ErrorHandler.handle(error, logger, {
        operation: 'getMembershipByWhatsappIdAndGroup',
        whatsappId,
        groupId,
      });
    }
  }

  async findMemberByWhatsappIdOrLid(whatsappId: string) {
    try {
      return await this.prisma.member.findFirst({
        where: {
          OR: [{ whatsappId }, { whatsappLid: whatsappId }],
        },
      });
    } catch (error) {
      throw ErrorHandler.handle(error, logger, {
        operation: 'findMemberByWhatsappIdOrLid',
        whatsappId,
      });
    }
  }

  async upsertMember(data: {
    whatsappId: string;
    whatsappNumber: string;
    whatsappLid?: string;
    name?: string;
  }) {
    try {
      // When Evolution sends a LID-based ID and we have a real phone number,
      // look up the existing member by phone to update their LID instead of
      // creating a duplicate (LID migrations happen when WA reassigns LIDs).
      const isLidBased = data.whatsappId.endsWith('@lid');
      const phoneIsReal = /^\d+$/.test(data.whatsappNumber);
      if (isLidBased && phoneIsReal) {
        const existing = await this.prisma.member.findFirst({
          where: { whatsappNumber: data.whatsappNumber },
        });
        if (existing) {
          logger.debug('Repository: Updating existing member LID on re-join', {
            memberId: existing.memberId,
            oldWhatsappId: existing.whatsappId,
            newLid: data.whatsappId,
          });
          return await this.prisma.member.update({
            where: { memberId: existing.memberId },
            data: {
              whatsappLid: data.whatsappId,
              ...(data.name && { name: data.name }),
            },
          });
        }
      }

      return await this.prisma.member.upsert({
        where: { whatsappId: data.whatsappId },
        update: {
          ...(data.whatsappLid && { whatsappLid: data.whatsappLid }),
          ...(data.name && { name: data.name }),
        },
        create: {
          whatsappId: data.whatsappId,
          whatsappNumber: data.whatsappNumber,
          whatsappLid: data.whatsappLid,
          name: data.name,
        },
      });
    } catch (error) {
      throw ErrorHandler.handle(error, logger, { operation: 'upsertMember', ...data });
    }
  }

  async updateMemberNameIfChanged(whatsappId: string, name: string) {
    try {
      const normalizedName = name.trim();
      if (!normalizedName) {
        return null;
      }

      const member = await this.prisma.member.findFirst({
        where: {
          OR: [{ whatsappId }, { whatsappLid: whatsappId }],
        },
        select: {
          memberId: true,
          name: true,
        },
      });

      if (!member || member.name === normalizedName) {
        return member;
      }

      return await this.prisma.member.update({
        where: { memberId: member.memberId },
        data: { name: normalizedName },
      });
    } catch (error) {
      throw ErrorHandler.handle(error, logger, {
        operation: 'updateMemberNameIfChanged',
        whatsappId,
      });
    }
  }

  async upsertMembership(data: {
    memberId: number;
    groupId: number;
    isOwner: boolean;
    isAdmin: boolean;
  }) {
    try {
      return await this.prisma.membership.upsert({
        where: {
          memberId_groupId: { memberId: data.memberId, groupId: data.groupId },
        },
        update: {
          isActive: true,
          dtLeft: null,
          dtJoined: new Date(),
          isOwner: data.isOwner,
          isAdmin: data.isAdmin,
        },
        create: {
          memberId: data.memberId,
          groupId: data.groupId,
          isOwner: data.isOwner,
          isAdmin: data.isAdmin,
        },
      });
    } catch (error) {
      throw ErrorHandler.handle(error, logger, { operation: 'upsertMembership', ...data });
    }
  }

  async upsertGroup(name: string, whatsappId: string) {
    try {
      logger.debug('Repository: Upserting group', { name, whatsappId });
      return await this.prisma.group.upsert({
        where: { whatsappId },
        update: { name },
        create: { name, whatsappId },
      });
    } catch (error) {
      throw ErrorHandler.handle(error, logger, { operation: 'upsertGroup', name, whatsappId });
    }
  }

  async getAllGroups() {
    try {
      logger.debug('Repository: Fetching all groups');
      return await this.prisma.group.findMany();
    } catch (error) {
      throw ErrorHandler.handle(error, logger, { operation: 'getAllGroups' });
    }
  }

  async getAllGroupsWithConfigs() {
    try {
      logger.debug('Repository: Fetching all groups with configs');
      return await this.prisma.group.findMany({ include: { groupConfigs: true } });
    } catch (error) {
      throw ErrorHandler.handle(error, logger, { operation: 'getAllGroupsWithConfigs' });
    }
  }

  async getUserByWhatsappId(whatsappId: string) {
    try {
      logger.debug('Repository: Fetching user by WhatsApp ID', { whatsappId });
      const user = await this.prisma.member.findUnique({ where: { whatsappId } });
      if (!user) throw new NotFoundError('User not found', { whatsappId });
      return user;
    } catch (error) {
      throw ErrorHandler.handle(error, logger, { operation: 'getUserByWhatsappId', whatsappId });
    }
  }

  async deleteMembership(whatsappId: string, groupWhatsappId: string) {
    try {
      const member = await this.findMemberByWhatsappIdOrLid(whatsappId);
      const group = await this.prisma.group.findUnique({ where: { whatsappId: groupWhatsappId } });
      if (!member || !group) return null;
      return await this.prisma.membership.updateMany({
        where: { memberId: member.memberId, groupId: group.groupId },
        data: { isActive: false, dtLeft: new Date() },
      });
    } catch (error) {
      throw ErrorHandler.handle(error, logger, {
        operation: 'deleteMembership',
        whatsappId,
        groupWhatsappId,
      });
    }
  }

  async incrementMessageCount(whatsappId: string, groupWhatsappId: string) {
    try {
      const member = await this.findMemberByWhatsappIdOrLid(whatsappId);
      const group = await this.prisma.group.findUnique({ where: { whatsappId: groupWhatsappId } });
      if (!member || !group) return null;

      const now = new Date();

      // Update membership with all-time count
      const updateResult = await this.prisma.membership.updateMany({
        where: { memberId: member.memberId, groupId: group.groupId, isActive: true },
        data: { messageCount: { increment: 1 }, dtLastMessage: now },
      });

      // Record stats for weekly and monthly periods
      if (updateResult.count > 0) {
        const membership = await this.prisma.membership.findFirst({
          where: { memberId: member.memberId, groupId: group.groupId },
        });

        if (membership) {
          // Upsert weekly and monthly stats
          await Promise.all([
            this.upsertMessageStats(
              membership.membershipId,
              'week',
              getPeriodStart('week', now),
            ),
            this.upsertMessageStats(
              membership.membershipId,
              'month',
              getPeriodStart('month', now),
            ),
          ]);
        }
      }

      return updateResult;
    } catch (error) {
      throw ErrorHandler.handle(error, logger, {
        operation: 'incrementMessageCount',
        whatsappId,
        groupWhatsappId,
      });
    }
  }

  async upsertMessageStats(
    membershipId: number,
    periodType: 'week' | 'month',
    periodStart: Date,
  ) {
    try {
      return await this.prisma.messageStats.upsert({
        where: {
          membershipId_periodType_periodStart: {
            membershipId,
            periodType,
            periodStart,
          },
        },
        update: { count: { increment: 1 } },
        create: {
          membershipId,
          periodType,
          periodStart,
          count: 1,
        },
      });
    } catch (error) {
      throw ErrorHandler.handle(error, logger, {
        operation: 'upsertMessageStats',
        membershipId,
        periodType,
      });
    }
  }

  async getTopActiveMembersByPeriod(
    groupWhatsappId: string,
    periodType: 'week' | 'month',
    limit: number,
  ) {
    try {
      const group = await this.prisma.group.findUnique({ where: { whatsappId: groupWhatsappId } });
      if (!group) throw new NotFoundError('Group not found', { groupWhatsappId });

      const periodStart = getPeriodStart(periodType);

      const stats = await this.prisma.messageStats.findMany({
        where: {
          membership: {
            groupId: group.groupId,
            isActive: true,
            ...(botWhatsappNumber
              ? {
                  member: {
                    whatsappNumber: {
                      not: botWhatsappNumber,
                    },
                  },
                }
              : {}),
          },
          periodType,
          periodStart,
        },
        orderBy: { count: 'desc' },
        take: limit,
        include: { membership: { include: { member: true } } },
      });

      return stats.map((stat) => ({
        whatsappNumber: stat.membership.member.whatsappNumber,
        name: stat.membership.member.name,
        messageCount: stat.count,
      }));
    } catch (error) {
      throw ErrorHandler.handle(error, logger, {
        operation: 'getTopActiveMembersByPeriod',
        groupWhatsappId,
        periodType,
        limit,
      });
    }
  }

  async getTopActiveMembers(groupWhatsappId: string, limit: number) {
    try {
      const group = await this.prisma.group.findUnique({ where: { whatsappId: groupWhatsappId } });
      if (!group) throw new NotFoundError('Group not found', { groupWhatsappId });
      return await this.prisma.membership.findMany({
        where: {
          groupId: group.groupId,
          isActive: true,
          ...(botWhatsappNumber
            ? {
                member: {
                  whatsappNumber: {
                    not: botWhatsappNumber,
                  },
                },
              }
            : {}),
        },
        orderBy: { messageCount: 'desc' },
        take: limit,
        include: { member: true },
      });
    } catch (error) {
      throw ErrorHandler.handle(error, logger, {
        operation: 'getTopActiveMembers',
        groupWhatsappId,
        limit,
      });
    }
  }

  async getInactiveMembers(groupId: number, inactiveDays: number) {
    try {
      logger.debug('Repository: Fetching inactive members', { groupId, inactiveDays });
      const cutoffDate = new Date(Date.now() - inactiveDays * 24 * 60 * 60 * 1000);
      return await this.prisma.membership.findMany({
        where: {
          groupId,
          isActive: true,
          ...(botWhatsappNumber
            ? {
                member: {
                  whatsappNumber: {
                    not: botWhatsappNumber,
                  },
                },
              }
            : {}),
          OR: [
            { dtLastMessage: { lt: cutoffDate } },
            {
              dtLastMessage: null,
              dtJoined: { lt: cutoffDate }, // If never sent a message, check if they are new
            },
          ],
        },
        include: { member: true },
      });
    } catch (error) {
      throw ErrorHandler.handle(error, logger, { operation: 'getInactiveMembers', groupId });
    }
  }
}
