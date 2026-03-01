import 'module-alias/register';
// ✅ Validate environment variables first
import { env } from './config/env';

import app from './http/app';
import { scheduleAllGroupJobs, cancelInactivityCheckJob } from './jobs/group-jobs';
import { startGroupWorker } from './jobs/group-worker';
import logger from './lib/logger';
const start = async () => {
  try {
    startGroupWorker();
    await scheduleAllGroupJobs();
    await cancelInactivityCheckJob();
    const port = env.PORT;
    const host = env.HOST;
    await app.listen({ port, host });
    logger.info('server_listening', { port, host });
  } catch (error) {
    logger.error('server_start_failed', { error });
    process.exit(1);
  }
};

void start();
