// src/types/evolution.ts
import { z } from 'zod';

export const EvolutionMessageDataSchema = z.object({
  key: z.object({
    remoteJid: z.string(),
    fromMe: z.boolean(),
    id: z.string(),
  }),
  pushName: z.string(),
  message: z.object({
    conversation: z.string().optional(),
    messageContextInfo: z.record(z.string(), z.unknown())
  }),
  messageType: z.string(),
  messageTimestamp: z.number(),
  instanceId: z.string(),
  source: z.string(),
});

export const EvolutionWebhookSchema = z.object({
  event: z.string(),
  instance: z.string(),
  data: EvolutionMessageDataSchema,
  destination: z.string(),
  date_time: z.string(),
  sender: z.string(),
  server_url: z.string(),
  apikey: z.string(),
});

// Infer types from schema — no need to duplicate
export type EvolutionWebhookPayload = z.infer<typeof EvolutionWebhookSchema>;
export type EvolutionMessageData = z.infer<typeof EvolutionMessageDataSchema>;