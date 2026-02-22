import { PrismaClient } from '@@/generated/prisma/client';
import logger from '@/lib/logger';
import { ErrorHandler } from '@/lib/error-handler';
import { NotFoundError, ValidationError } from '@/lib/errors';
import type { GroupUpdateInput } from '@/types/repository.types';
import { is } from 'zod/v4/locales';

export class GroupRepository {
  constructor(private prisma: PrismaClient) {}

  async findGroupSettings(groupId: number) {
    try {
      logger.debug('Repository: Fetching group settings', { groupId });

      if (!groupId) {
        throw new ValidationError('Group ID is required', { groupId });
      }

      const group = await this.prisma.group.findUnique({
        where: { groupId: groupId },
      });

      if (!group) {
        throw new NotFoundError('Group not found', { groupId });
      }

      return group;
    } catch (error) {
      throw ErrorHandler.handle(error, logger, { operation: 'findGroupSettings', groupId });
    }
  }

  async getGroupById(groupId: number) {
    try {
      logger.debug('Repository: Getting group by ID', { groupId });
      const group = await this.prisma.group.findUnique({
        where: { groupId: groupId },
      });

      if (!group) {
        throw new NotFoundError('Group not found', { groupId });
      }

      return group;
    } catch (error) {
      throw ErrorHandler.handle(error, logger, { operation: 'getGroupById', groupId });
    }
  }

  async getGroupByWhatsappId(whatsappId: string) {
    try {
      logger.debug('Repository: Getting group by WhatsApp ID', { whatsappId });
      const group = await this.prisma.group.findUnique({
        where: { whatsappId: whatsappId },
      });

      if (!group) {
        throw new NotFoundError('Group not found', { whatsappId });
      }

      return group;
    } catch (error) {
      throw ErrorHandler.handle(error, logger, { operation: 'getGroupByWhatsappId', whatsappId });
    }
  }
  async getRegisteredOwners(groupId: number) {
    try {
      logger.debug('Repository: Fetching registered group owners', { groupId });
      const owners = await this.prisma.membership.findMany({
        where: { groupId: groupId, isOwner: true },
        include: { member: true },
      });
      return owners;
    } catch (error) {
      throw ErrorHandler.handle(error, logger, { operation: 'getRegisteredOwners', groupId });
    }
  }

  async updateGroupSettings(groupId: number, data: GroupUpdateInput) {
    try {
      const group = await this.prisma.group.findUnique({
        where: { groupId: groupId },
      });
      if (!group) {
        throw new NotFoundError('Group not found', { groupId });
      }
      logger.debug('Repository: Updating group settings', { groupId });
      return await this.prisma.group.update({
        where: { groupId: groupId },
        data,
      });
    } catch (error) {
      throw ErrorHandler.handle(error, logger, {
        operation: 'updateGroupSettings',
        groupId,
      });
    }
  }
  // group.repository.ts
async getOwnedGroupByMemberWhatsappId(whatsappId: string) {
  try {
    logger.debug('Repository: Fetching owned group by member WhatsApp ID', { whatsappId });
    
    // First check if member exists
    const member = await this.prisma.member.findUnique({
      where: { whatsappId },
    });
    logger.debug('Member found', { member });

    const membership = await this.prisma.membership.findFirst({
      where: {
        member: { whatsappId },
        isOwner: true,
      },
      include: { group: true },
    });
    logger.debug('Membership found', { membership });

    if (!membership) return null;

    return membership.group;
  } catch (error) {
    throw ErrorHandler.handle(error, logger, {
      operation: 'getOwnedGroupByMemberWhatsappId',
      whatsappId,
    });
  }
}
async getOwnedGroupByMemberAndGroupName(whatsappId: string, groupName: string) {
  const membership = await this.prisma.membership.findFirst({
    where: {
      isOwner: true,
      member: { whatsappId },
      group: { name: { contains: groupName, mode: 'insensitive' } },
    },
    include: { group: true },
  });

  return membership?.group ?? null;
}
  async upsertMember(data: { whatsappId: string; whatsappNumber: string }) {
    return await this.prisma.member.upsert({
      where: { whatsappId: data.whatsappId },
      update: {},
      create: {
        whatsappId: data.whatsappId,
        whatsappNumber: data.whatsappNumber,
      },
    });
  }

  async upsertMembership(data: {
    memberId: number;
    groupId: number;
    isOwner: boolean;
    isAdmin: boolean;
  }) {
    return await this.prisma.membership.upsert({
      where: {
        memberId_groupId: {
          memberId: data.memberId,
          groupId: data.groupId,
        },
      },
      update: {},
      create: {
        memberId: data.memberId,
        groupId: data.groupId,
        isOwner: data.isOwner,
        isAdmin: data.isAdmin,
      },
    });
  }
  async createWithDefaultSettings(name: string, whatsappId: string) {
    try {
      if (!name) {
        throw new ValidationError('Group name is required', { name });
      }

      logger.debug('Repository: Creating default group settings', { name });
      return await this.prisma.group.create({
        data: {
          name,
          whatsappId,
          openTime: '09:00',
          closeTime: '17:00',
        },
      });
    } catch (error) {
      throw ErrorHandler.handle(error, logger, {
        operation: 'createWithDefaultSettings',
        name,
        whatsappId,
      });
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
      const user = await this.prisma.member.findUnique({
        where: { whatsappId: whatsappId },
      });

      if (!user) {
        throw new NotFoundError('User not found', { whatsappId });
      }

      return user;
    } catch (error) {
      throw ErrorHandler.handle(error, logger, { operation: 'getUserByWhatsappId', whatsappId });
    }
  }
}
