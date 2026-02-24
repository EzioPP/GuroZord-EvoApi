// src/types/evolution.ts
import { z } from 'zod';

const BaseWebhookSchema = z.object({
  instance: z.string(),
  destination: z.string().optional(),
  date_time: z.string(),
  sender: z.string().optional(),
  server_url: z.string().optional(),
  apikey: z.string().optional(),
});

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

export const EvolutionWebhookSchema = BaseWebhookSchema.extend({
  event: z.literal('messages.upsert'),
  data: EvolutionMessageDataSchema,
});

export const GroupParticipantSchema = z.object({
  id: z.string(),
  phoneNumber: z.string(),
  admin: z.string().nullable(),
});

export const GroupParticipantDataSchema = z.object({
  jid: z.object({
    id: z.string(),
    phoneNumber: z.string(),
    admin: z.string().nullable(),
  }),
  phoneNumber: z.string(),
});

export const GroupParticipantsUpdateDataSchema = z.object({
  id: z.string(),
  author: z.string().nullable(),  // was z.string()
  participants: z.array(GroupParticipantSchema),
  action: z.enum(['add', 'remove', 'promote', 'demote']),
  participantsData: z.array(GroupParticipantDataSchema),
});

export const GroupParticipantsUpdateWebhookSchema = BaseWebhookSchema.extend({
  event: z.literal('group-participants.update'),
  data: GroupParticipantsUpdateDataSchema,
});

export const AnyEvolutionWebhookSchema = z.discriminatedUnion('event', [
  EvolutionWebhookSchema,
  GroupParticipantsUpdateWebhookSchema,
]);

export type EvolutionWebhookPayload = z.infer<typeof EvolutionWebhookSchema>;
export type EvolutionMessageData = z.infer<typeof EvolutionMessageDataSchema>;

export type GroupParticipantsUpdateWebhookPayload = z.infer<typeof GroupParticipantsUpdateWebhookSchema>;
export type GroupParticipantsUpdateData = z.infer<typeof GroupParticipantsUpdateDataSchema>;
export type GroupParticipant = z.infer<typeof GroupParticipantSchema>;

export type AnyEvolutionWebhook = z.infer<typeof AnyEvolutionWebhookSchema>;