// group.service.ts
import { Logger } from 'winston';
import { GroupRepository } from '@/persistence';
import type { GroupUpdateInput } from '@/types/repository.types';
import { ValidationError } from '@/lib/errors';
import { cancelGroupJobs, scheduleGroupJobs } from '@/jobs/group-jobs';
import { WhatsappClient } from '@/clients/whatsapp.client';
import { tr } from 'zod/v4/locales';

export class GroupService {
  constructor(
    private groupRepository: GroupRepository,
    private whatsappClient: WhatsappClient,
    private logger: Logger,
  ) {}

  async changeOpenCloseTimes(groupId: number, openTime: string, closeTime: string) {
    if (!groupId) throw new ValidationError('Group ID is required', { groupId });
    if (!openTime || !closeTime)
      throw new ValidationError('Both openTime and closeTime are required', {
        groupId,
        openTime,
        closeTime,
      });
    this.logger.info('Service: Changing open/close times for group', {
      groupId,
      openTime,
      closeTime,
    });
    const updateData: GroupUpdateInput = { openTime, closeTime };
    const result = await this.groupRepository.updateGroupSettings(groupId, updateData);
    await cancelGroupJobs(groupId);
    await scheduleGroupJobs(groupId, openTime, closeTime);
    return result;
  }

  async openGroup(groupId: number) {
    if (!groupId) throw new ValidationError('Group ID is required', { groupId });
    this.logger.info('Service: Opening group', { groupId });
    const group = await this.groupRepository.getGroupById(groupId);
    await this.whatsappClient.openGroup(group.whatsappId);
    return await this.groupRepository.updateGroupSettings(groupId, { isClosed: false });
  }

  async closeGroup(groupId: number) {
    if (!groupId) throw new ValidationError('Group ID is required', { groupId });
    this.logger.info('Service: Closing group', { groupId });
    const group = await this.groupRepository.getGroupById(groupId);
    await this.whatsappClient.closeGroup(group.whatsappId);
    return await this.groupRepository.updateGroupSettings(groupId, { isClosed: true });
  }

  async getAllGroupsWhatsapp() {
    this.logger.info('Service: Fetching all groups from WhatsApp');
    return await this.whatsappClient.findGroups();
  }

  async getAllGroups() {
    this.logger.info('Service: Fetching all groups from database');
    return await this.groupRepository.getAllGroups();
  }

  async getGroupParticipants(whatsappId: string) {
    return await this.whatsappClient.findGroupParticipants(whatsappId);
  }

  async getGroupById(groupId: number) {
    if (!groupId) throw new ValidationError('Group ID is required', { groupId });
    this.logger.debug('Service: Fetching group by ID', { groupId });
    return await this.groupRepository.getGroupById(groupId);
  }

  async getGroupByWhatsappId(whatsappId: string) {
    if (!whatsappId) throw new ValidationError('WhatsApp ID is required', { whatsappId });
    this.logger.debug('Service: Fetching group by WhatsApp ID', { whatsappId });
    return await this.groupRepository.getGroupByWhatsappId(whatsappId);
  }

  async getUserByWhatsappId(whatsappId: string) {
    if (!whatsappId) throw new ValidationError('WhatsApp ID is required', { whatsappId });
    this.logger.debug('Service: Fetching user by WhatsApp ID', { whatsappId });
    return await this.groupRepository.getUserByWhatsappId(whatsappId);
  }

  async getOwnedGroupByMemberWhatsappId(whatsappId: string) {
    if (!whatsappId) throw new ValidationError('WhatsApp ID is required', { whatsappId });
    this.logger.debug('Service: Fetching owned group by member WhatsApp ID', { whatsappId });
    return await this.groupRepository.getOwnedGroupByMemberWhatsappId(whatsappId);
  }

  async getOwnedGroupByMemberAndGroupName(whatsappId: string, groupName: string) {
    if (!whatsappId) throw new ValidationError('WhatsApp ID is required', { whatsappId });
    if (!groupName) throw new ValidationError('Group name is required', { groupName });
    this.logger.debug('Service: Fetching owned group by member and group name', {
      whatsappId,
      groupName,
    });
    return await this.groupRepository.getOwnedGroupByMemberAndGroupName(whatsappId, groupName);
  }

  async syncGroups() {
    try {
      this.logger.info('Service: Checking and syncing groups with WhatsApp');
      const whatsappGroups = await this.whatsappClient.findGroups();
      const dbGroups = await this.groupRepository.getAllGroups();
      const dbWhatsappIds = dbGroups.map((g) => g.whatsappId);

      this.logger.info('Service: Syncing groups', {
        whatsappGroupCount: whatsappGroups.length,
        dbGroupCount: dbGroups.length,
      });

      for (const group of whatsappGroups) {
        const participants = await this.whatsappClient.findGroupParticipants(group.whatsappId);
        const owner = participants.find((p) => p.role === 'superadmin');

        if (!owner) {
          this.logger.info('Group has no owner, syncing without owner', {
            whatsappId: group.whatsappId,
          });
        }

        const upsertedMembers = await Promise.all(
          participants.map((p) =>
            this.groupRepository.upsertMember({
              whatsappId: p.whatsappId,
              whatsappNumber: p.whatsappId.split('@')[0],
              whatsappLid: p.lid ?? undefined,
            }),
          ),
        );

        let dbGroup = dbGroups.find((g) => g.whatsappId === group.whatsappId);

        if (!dbWhatsappIds.includes(group.whatsappId)) {
          this.logger.info('Creating group', { whatsappId: group.whatsappId, name: group.name });
          dbGroup = await this.groupRepository.createWithDefaultSettings(
            group.name,
            group.whatsappId,
          );
        } else if (dbGroup && dbGroup.name !== group.name) {
          this.logger.info('Group name changed, updating', {
            whatsappId: group.whatsappId,
            oldName: dbGroup.name,
            newName: group.name,
          });
          dbGroup = await this.groupRepository.updateGroupSettings(dbGroup.groupId, {
            name: group.name,
          });
        }

        await Promise.all(
          participants.map((p, i) => {
            const isOwner = p.role === 'superadmin';
            const isAdmin = p.role === 'admin' || isOwner;
            return this.groupRepository.upsertMembership({
              memberId: upsertedMembers[i].memberId,
              groupId: dbGroup!.groupId,
              isOwner,
              isAdmin,
            });
          }),
        );

        this.logger.info('Synced group', {
          whatsappId: group.whatsappId,
          participantCount: participants.length,
          ownerWhatsappId: owner?.whatsappId ?? null,
        });
      }

      this.logger.info('Service: Group sync complete');
    } catch (err) {
      this.logger.error('Service: Group sync failed', {
        err: err instanceof Error ? { message: err.message, stack: err.stack } : err,
      });
      throw err;
    }
  }

  async isMemberAdmin(whatsappId: string, groupId: number): Promise<boolean> {
    if (!whatsappId) throw new ValidationError('WhatsApp ID is required', { whatsappId });
    if (!groupId) throw new ValidationError('Group ID is required', { groupId });
    const membership = await this.groupRepository.getMembershipByWhatsappIdAndGroup(
      whatsappId,
      groupId,
    );
    return membership?.isAdmin ?? false;
  }

  async addMembership(whatsappId: string, groupWhatsappId: string, whatsappLid?: string) {
    if (!whatsappId) throw new ValidationError('WhatsApp ID is required', { whatsappId });
    if (!groupWhatsappId)
      throw new ValidationError('Group WhatsApp ID is required', { groupWhatsappId });
    this.logger.info('Service: Adding membership', { whatsappId, groupWhatsappId });
    const member = await this.groupRepository.upsertMember({
      whatsappId,
      whatsappNumber: whatsappId.split('@')[0],
      whatsappLid,
    });
    const group = await this.groupRepository.getGroupByWhatsappId(groupWhatsappId);
    return await this.groupRepository.upsertMembership({
      memberId: member.memberId,
      groupId: group.groupId,
      isOwner: false,
      isAdmin: false,
    });
  }

  async getTopActiveMembers(groupWhatsappId: string, limit: number) {
    if (!groupWhatsappId)
      throw new ValidationError('Group WhatsApp ID is required', { groupWhatsappId });
    if (limit <= 0)
      throw new ValidationError('Limit must be greater than 0', { groupWhatsappId, limit });
    this.logger.info('Service: Fetching top active members for group', { groupWhatsappId, limit });
    const results = await this.groupRepository.getTopActiveMembers(groupWhatsappId, limit);
    return results.map((r) => ({
      whatsappNumber: r.member.whatsappNumber,
      messageCount: r.messageCount,
    }));
  }

  async removeMembership(whatsappId: string, groupWhatsappId: string) {
    if (!whatsappId) throw new ValidationError('WhatsApp ID is required', { whatsappId });
    if (!groupWhatsappId)
      throw new ValidationError('Group WhatsApp ID is required', { groupWhatsappId });
    this.logger.info('Service: Removing membership', { whatsappId, groupWhatsappId });
    return await this.groupRepository.deleteMembership(whatsappId, groupWhatsappId);
  }

  async incrementMessageCount(whatsappId: string, groupWhatsappId: string) {
    if (!whatsappId) throw new ValidationError('WhatsApp ID is required', { whatsappId });
    if (!groupWhatsappId)
      throw new ValidationError('Group WhatsApp ID is required', { groupWhatsappId });
    return await this.groupRepository.incrementMessageCount(whatsappId, groupWhatsappId);
  }
}
