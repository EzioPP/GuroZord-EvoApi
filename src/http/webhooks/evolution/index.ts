import { FastifyInstance } from 'fastify';
import { EvolutionWebhookSchema } from '@/types/evolution.types';
import { eventHandlers } from './events';

export async function evolutionWebhookRoutes(app: FastifyInstance) {
  app.post('/webhook/evolution', async (request, reply) => {
    const payload = EvolutionWebhookSchema.parse(request.body);
    const handler = eventHandlers[payload.event];

    if (handler) {
      await handler(payload.data);
    }

    reply.send({ status: 'ok' });
  });
}