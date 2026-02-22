import app from './http/app';
import { scheduleAllGroupJobs } from './jobs/group-jobs';
import { startGroupWorker } from './jobs/group-worker';
import logger from './lib/logger';

const start = async () => {
  try {
    startGroupWorker();
    await scheduleAllGroupJobs();
    const port = Number(process.env.PORT ?? 3000);
    const host = process.env.HOST ?? '0.0.0.0';
    await app.listen({ port, host });
    logger.info('server_listening', { port, host });
  } catch (error) {
    logger.error('server_start_failed', { error });
    process.exit(1);
  }
};

void start();
