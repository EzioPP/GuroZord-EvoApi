// src/lib/server-utc-offset.ts
import logger from '@/lib/logger';

const OFFSET_MS = process.env.NODE_ENV === 'production' ? 0 : 3 * 60 * 60 * 1000;
logger.info('UTC offset configured', {
  env: process.env.NODE_ENV,
  offsetHours: OFFSET_MS / 3600000,
});

export function nowUtc(): number {
  return Date.now() - OFFSET_MS;
}