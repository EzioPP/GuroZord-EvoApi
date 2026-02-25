import { PrismaClient } from '@@/generated/prisma/client';
import logger from '@/lib/logger';
import { ErrorHandler } from '@/lib/error-handler';
import { NotFoundError } from '@/lib/errors';
import type { GroupUpdateInput } from '@/types/repository.types';

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
      throw ErrorHandler.handle(error, logger, { operation: 'getOwnedGroupByMemberWhatsappId', whatsappId });
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
      throw ErrorHandler.handle(error, logger, { operation: 'getOwnedGroupByMemberAndGroupName', whatsappId, groupName });
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
      throw ErrorHandler.handle(error, logger, { operation: 'getMembershipByWhatsappIdAndGroup', whatsappId, groupId });
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
      throw ErrorHandler.handle(error, logger, { operation: 'findMemberByWhatsappIdOrLid', whatsappId });
    }
  }

  async upsertMember(data: { whatsappId: string; whatsappNumber: string; whatsappLid?: string }) {
    try {
      return await this.prisma.member.upsert({
        where: { whatsappId: data.whatsappId },
        update: {
          ...(data.whatsappLid && { whatsappLid: data.whatsappLid }),
        },
        create: {
          whatsappId: data.whatsappId,
          whatsappNumber: data.whatsappNumber,
          whatsappLid: data.whatsappLid,
        },
      });
    } catch (error) {
      throw ErrorHandler.handle(error, logger, { operation: 'upsertMember', ...data });
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

  async createWithDefaultSettings(name: string, whatsappId: string) {
    try {
      logger.debug('Repository: Creating default group settings', { name });
      return await this.prisma.group.create({
        data: { name, whatsappId, openTime: '09:00', closeTime: '17:00' },
      });
    } catch (error) {
      throw ErrorHandler.handle(error, logger, { operation: 'createWithDefaultSettings', name, whatsappId });
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
      throw ErrorHandler.handle(error, logger, { operation: 'deleteMembership', whatsappId, groupWhatsappId });
    }
  }

  async incrementMessageCount(whatsappId: string, groupWhatsappId: string) {
    try {
      const member = await this.findMemberByWhatsappIdOrLid(whatsappId);
      const group = await this.prisma.group.findUnique({ where: { whatsappId: groupWhatsappId } });
      logger.debug('Incrementing message count', { whatsappId, groupWhatsappId, memberId: member?.memberId });
      if (!member || !group) return null;
      return await this.prisma.membership.updateMany({
        where: { memberId: member.memberId, groupId: group.groupId, isActive: true },
        data: { messageCount: { increment: 1 }, dtLastMessage: new Date() },
      });
    } catch (error) {
      throw ErrorHandler.handle(error, logger, { operation: 'incrementMessageCount', whatsappId, groupWhatsappId });
    }
  }


  async getTopActiveMembers(groupWhatsappId: string, limit: number) {
    try {
      const group = await this.prisma.group.findUnique({ where: { whatsappId: groupWhatsappId } });
      if (!group) throw new NotFoundError('Group not found', { groupWhatsappId });
      return await this.prisma.membership.findMany({
        where: { groupId: group.groupId, isActive: true },
        orderBy: { messageCount: 'desc' },
        take: limit,
        include: { member: true },
      });
    } catch (error) {
      throw ErrorHandler.handle(error, logger, { operation: 'getTopActiveMembers', groupWhatsappId, limit });
    }
  }
}