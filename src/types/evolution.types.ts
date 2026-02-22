// src/types/evolution.ts
import { z } from 'zod';

export const EvolutionMessageDataSchema = z.object({
  key: z.object({
    remoteJid: z.string(),
    fromMe: z.boolean(),
    id: z.string(),
  }),
  pushName: z.string().optional(),
  message: z
    .object({
      conversation: z.string().optional(),
      messageContextInfo: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
  messageType: z.string(),
  messageTimestamp: z.number(),
  instanceId: z.string(),
  source: z.string(),
});

export const EvolutionWebhookSchema = z.object({
  event: z.string(),
  instance: z.string(),
  data: EvolutionMessageDataSchema,
  destination: z.string().optional(),
  date_time: z.string(),
  sender: z.string().optional(),
  server_url: z.string().optional(),
  apikey: z.string().optional(),
});

export type EvolutionWebhookPayload = z.infer<typeof EvolutionWebhookSchema>;
export type EvolutionMessageData = z.infer<typeof EvolutionMessageDataSchema>;
