import { FastifyInstance } from 'fastify';
import { EvolutionWebhookSchema } from '@/types/evolution.types';
import { eventHandlers } from './events';
import logger from '@/lib/logger';

export async function evolutionWebhookRoutes(app: FastifyInstance) {
  app.post('/webhook/evolution', async (request, reply) => {
    const payload = EvolutionWebhookSchema.parse(request.body);
    logger.info('Received Evolution webhook', { event: payload.event, data: payload.data });
    const handler = eventHandlers[payload.event];

    if (handler) {
      await handler(payload.data);
    }

    reply.send({ status: 'ok' });
  });
}
