import logger from '@/lib/logger';
import { groupJobsQueue } from '@/jobs/queue';
import prisma from '@/lib/prisma';

const toJobId = (action: 'open' | 'close', groupId: string): string => {
  return `${action}-${groupId}`;
};

const timeToCron = (timeStr: string): string => {
  const [hours, minutes] = timeStr.split(':');
  return `${minutes} ${hours} * * *`;
};

export const scheduleGroupJobs = async (
  groupId: number,
  openTime: string,
  closeTime: string,
): Promise<void> => {
  const openJobId = toJobId('open', groupId.toString());
  const closeJobId = toJobId('close', groupId.toString());
  await groupJobsQueue.upsertJobScheduler(
    openJobId,
    { pattern: timeToCron(openTime) },
    { name: 'open-group', data: { groupId } },
  );

  await groupJobsQueue.upsertJobScheduler(
    closeJobId,
    { pattern: timeToCron(closeTime) },
    { name: 'close-group', data: { groupId } },
  );
};
export const scheduleGroupSyncJob = async (): Promise<void> => {
  await groupJobsQueue.upsertJobScheduler(
    'sync-groups',
    { pattern: '0 * * * *' }, // every hour
    { name: 'sync-groups', data: {} },
  );
  logger.info('group_sync_job_scheduled');
};
export const cancelGroupJobs = async (groupId: number): Promise<void> => {
  await groupJobsQueue.removeJobScheduler(toJobId('open', groupId.toString()));
  await groupJobsQueue.removeJobScheduler(toJobId('close', groupId.toString()));
  logger.info('group_jobs_cancelled', { groupId });
};

export const scheduleAllGroupJobs = async (): Promise<void> => {
  const groups = await prisma.group.findMany({
    where: {
      AND: [{ openTime: { not: undefined } }, { closeTime: { not: undefined } }],
    },
  });
  logger.info('group_jobs_boot_sync', { count: groups.length });

  for (const group of groups) {
    await scheduleGroupJobs(group.groupId, group.openTime!, group.closeTime!);
  }
};
