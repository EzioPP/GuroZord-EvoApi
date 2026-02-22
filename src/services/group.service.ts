import { Logger } from 'winston';
import { GroupRepository } from '@/persistence';
import type { GroupUpdateInput } from '@/types/repository.types';
import { ValidationError } from '@/lib/errors';
import { cancelGroupJobs, scheduleGroupJobs } from '@/jobs/group-jobs';
import { WhatsappClient } from '@/clients/whatsapp.client';

export class GroupService {
  constructor(
    private groupRepository: GroupRepository,
    private whatsappClient: WhatsappClient,
    private logger: Logger,
  ) {}

  async changeOpenCloseTimes(groupId: number, openTime: string, closeTime: string) {
    if (!groupId) throw new ValidationError('Group ID is required', { groupId });
    if (!openTime || !closeTime) throw new ValidationError('Both openTime and closeTime are required', { groupId, openTime, closeTime });

    this.logger.info('Service: Changing open/close times for group', { groupId, openTime, closeTime });

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
    this.logger.debug('Service: Fetching owned group by member and group name', { whatsappId, groupName });
    return await this.groupRepository.getOwnedGroupByMemberAndGroupName(whatsappId, groupName);
  }

  async syncGroups() {
    this.logger.info('Service: Checking and syncing groups with WhatsApp');
    const whatsappGroups = await this.whatsappClient.findGroups();
    const dbGroups = await this.groupRepository.getAllGroups();
    const dbWhatsappIds = dbGroups.map((g) => g.whatsappId);

    for (const group of whatsappGroups) {
      const participants = await this.whatsappClient.findGroupParticipants(group.whatsappId);
      const owner = participants.find((p) => p.role === 'superadmin');

      if (!owner) {
        this.logger.info('Group has no owner, skipping', { whatsappId: group.whatsappId });
        continue;
      }

      const member = await this.groupRepository.upsertMember({
        whatsappId: owner.whatsappId,
        whatsappNumber: owner.whatsappId.split('@')[0],
      });


let dbGroup = dbGroups.find((g) => g.whatsappId === group.whatsappId);

if (!dbWhatsappIds.includes(group.whatsappId)) {
  this.logger.info('Creating group', { whatsappId: group.whatsappId, name: group.name });
  dbGroup = await this.groupRepository.createWithDefaultSettings(group.name, group.whatsappId);
} else if (dbGroup && dbGroup.name !== group.name) {
  this.logger.info('Group name changed, updating', {
    whatsappId: group.whatsappId,
    oldName: dbGroup.name,
    newName: group.name,
  });
  dbGroup = await this.groupRepository.updateGroupSettings(dbGroup.groupId, { name: group.name });
}

      await this.groupRepository.upsertMembership({
        memberId: member.memberId,
        groupId: dbGroup!.groupId,
        isOwner: true,
        isAdmin: true,
      });

      this.logger.info('Synced group', { whatsappId: group.whatsappId, ownerWhatsappId: owner.whatsappId });
    }

    this.logger.info('Service: Group sync complete');
  }
}