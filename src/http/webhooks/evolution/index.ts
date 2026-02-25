// src/routes/evolution.webhook.ts
import { FastifyInstance } from 'fastify';
import { AnyEvolutionWebhookSchema } from '@/types/evolution.types';
import { eventHandlers } from './events';
import { nowUtc } from '@/lib/server-utc-offset';
import logger from '@/lib/logger';

const STALE_EVENT_THRESHOLD_SECONDS = 30;

export async function evolutionWebhookRoutes(app: FastifyInstance) {
  app.post('/webhook/evolution', async (request, reply) => {
    logger.info('Received request on Evolution webhook endpoint');

    const result = AnyEvolutionWebhookSchema.safeParse(request.body);

    if (!result.success) {
      return reply.send({ status: 'ok' });
    }

    const eventAge = (nowUtc() - new Date(result.data.date_time).getTime()) / 1000;

    if (eventAge > STALE_EVENT_THRESHOLD_SECONDS) {
      logger.warn('Dropping stale event', { event: result.data.event, ageSeconds: Math.round(eventAge) });
      return reply.send({ status: 'ok' });
    }

    const handler = eventHandlers[result.data.event];

    if (handler) {
      await handler(result.data.data);
    } else {
      logger.debug('No handler for event', { event: result.data.event });
    }

    reply.send({ status: 'ok' });
  });
}