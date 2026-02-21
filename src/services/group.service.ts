import { Logger } from 'winston';
import { GroupRepository } from '@/persistence';
import type { GroupUpdateInput } from '@/types/repository.types';
import { ValidationError } from '@/lib/errors';
import { scheduleGroupJobs } from '@/jobs/group-jobs';

export class GroupService {
  constructor(
    private groupRepository: GroupRepository,
    private logger: Logger,
  ) {}

  async changeOpenCloseTimes(groupId: number, openTime: string, closeTime: string) {
    if (!groupId) {
      throw new ValidationError('Group ID is required', { groupId });
    }
    if (!openTime || !closeTime) {
      throw new ValidationError('Both openTime and closeTime are required', {
        groupId,
        openTime,
        closeTime,
      });
    }
    this.logger.info('Service: Changing open/close times for group', {
      groupId,
      openTime,
      closeTime,
    });
    const updateData: GroupUpdateInput = {
      openTime,
      closeTime,
    };
    const result = await this.groupRepository.updateGroupSettings(groupId, updateData);

    await scheduleGroupJobs(groupId, openTime, closeTime);

    return result;
  }

  async openGroup(groupId: number) {
    if (!groupId) {
      throw new ValidationError('Group ID is required', { groupId });
    }

    this.logger.info('Service: Opening group', { groupId });
    return await this.groupRepository.updateGroupSettings(groupId, { isClosed: false });
  }

  async closeGroup(groupId: number) {
    if (!groupId) {
      throw new ValidationError('Group ID is required', { groupId });
    }

    this.logger.info('Service: Closing group', { groupId });
    return await this.groupRepository.updateGroupSettings(groupId, { isClosed: true });
  }
}
