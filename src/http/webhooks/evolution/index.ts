// src/routes/evolution.webhook.ts
import { FastifyInstance } from 'fastify';
import { AnyEvolutionWebhookSchema } from '@/types/evolution.types';
import { eventHandlers } from './events';
import logger from '@/lib/logger';

const STALE_EVENT_THRESHOLD_SECONDS = 30;

export async function evolutionWebhookRoutes(app: FastifyInstance) {
  app.post('/webhook/evolution', async (request, reply) => {
    logger.info('Received request on /webhook/evolution');
    const result = AnyEvolutionWebhookSchema.safeParse(request.body);
    if (!result.success) {
      return reply.send({ status: 'ok' });
    }

    const eventAge = (Date.now() - new Date(result.data.date_time).getTime()) / 1000;
    logger.info('Received Evolution webhook event', {
      event: result.data.event,
      eventAgeSeconds: Math.round(eventAge),
    });
        if (eventAge > STALE_EVENT_THRESHOLD_SECONDS) {
      logger.warn('Dropping stale event', {
        event: result.data.event,
        ageSeconds: Math.round(eventAge),
        eventCreateTime: result.data.date_time,
      });
      return reply.send({ status: 'ok' });
    }

    reply.send({ status: 'ok' });

    const handler = eventHandlers[result.data.event];

    if (handler) {
      handler(result.data.data).catch((err) =>
        logger.error('Error handling event', { event: result.data.event, err }),
      );
    }
  });
}
