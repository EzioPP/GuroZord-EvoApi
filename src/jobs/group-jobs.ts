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

export const scheduleInactivityCheckJob = async (): Promise<void> => {
  await groupJobsQueue.upsertJobScheduler(
    'check-inactivity',
    { pattern: '0 * * * *' }, // every hour
    { name: 'check-inactivity', data: {} },
  );
  logger.info('inactivity_check_job_scheduled');
};
export const cancelGroupJobs = async (groupId: number): Promise<void> => {
  await groupJobsQueue.removeJobScheduler(toJobId('open', groupId.toString()));
  await groupJobsQueue.removeJobScheduler(toJobId('close', groupId.toString()));
  logger.info('group_jobs_cancelled', { groupId });
};

export const scheduleAllGroupJobs = async (): Promise<void> => {
  const openConfigs = await prisma.groupConfig.findMany({
    where: { key: 'open_time', groupId: { not: null } },
  });

  let scheduled = 0;
  for (const openConfig of openConfigs) {
    if (!openConfig.groupId) continue;
    const closeConfig = await prisma.groupConfig.findUnique({
      where: {
        groupId_key_language: {
          groupId: openConfig.groupId,
          key: 'close_time',
          language: openConfig.language,
        },
      },
    });
    if (closeConfig) {
      await scheduleGroupJobs(openConfig.groupId, openConfig.value, closeConfig.value);
      scheduled++;
    }
  }

  logger.info('group_jobs_boot_sync', { count: scheduled });
};
