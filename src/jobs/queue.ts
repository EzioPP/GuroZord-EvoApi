import { Queue } from 'bullmq';

const redisConnection = {
  host: process.env.REDIS_HOST ?? '127.0.0.1',
  port: Number(process.env.REDIS_PORT ?? 6380),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

export { redisConnection };

export const groupJobsQueue = new Queue('group-jobs', {
  connection: redisConnection,
});
