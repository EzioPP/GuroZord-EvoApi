import Fastify from 'fastify';
import { evolutionWebhookRoutes } from './webhooks/evolution';

const app = Fastify({ logger: false });

app.get('/health', async () => {
  return { status: 'ok' };
});

app.get('/', async () => {
  return { message: 'GuroZord EvoApi running' };
});

// ✅ Use register instead of calling directly
app.register(evolutionWebhookRoutes);

export default app;