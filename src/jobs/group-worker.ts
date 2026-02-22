import { Worker } from 'bullmq';
import type { Job } from 'bullmq';
import logger from '@/lib/logger';
import { redisConnection } from '@/jobs/queue';
import { createGroupService } from '@/factory/services.factory';

let worker: Worker | null = null;

export const startGroupWorker = (): Worker => {
  if (worker) {
    return worker;
  }

  const groupService = createGroupService();

  worker = new Worker(
    'group-jobs',
    async (job: Job) => {
      const { groupId } = job.data as { groupId: number };

      if (job.name === 'open-group') {
        await groupService.openGroup(groupId);
        return;
      }

      if (job.name === 'close-group') {
        await groupService.closeGroup(groupId);
        return;
      }

      if (job.name === 'sync-groups') {
        await groupService.syncGroups();
        return;
      }

      logger.warn('group_job_unhandled', { name: job.name, groupId });
    },
    { connection: redisConnection },
  );

  worker.on('failed', (job: Job | undefined, error: Error) => {
    logger.error('group_job_failed', { jobId: job?.id, name: job?.name, error });
  });

  worker.on('error', (error: Error) => {
    logger.error('group_worker_error', { error });
  });

  logger.info('group_worker_started');

  return worker;
};
