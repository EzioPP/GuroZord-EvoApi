import { Queue } from 'bullmq';
import { URL } from 'url';
import { env } from '../config/env';

const redisUrl = new URL(env.REDIS_URI);

const redisConnection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port),
  password: redisUrl.password || undefined,
  maxRetriesPerRequest: null,
};

export { redisConnection };

export const groupJobsQueue = new Queue('group-jobs', {
  connection: redisConnection,
});