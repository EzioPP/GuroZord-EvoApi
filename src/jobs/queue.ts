import { Queue } from 'bullmq';
import { URL } from 'url';

const redisUrl = new URL(process.env.REDIS_URI ?? 'redis://127.0.0.1:6380');

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