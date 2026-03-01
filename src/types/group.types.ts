import z from 'zod';

// in your zod validation file
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const ConfigSchema = z.object({
  groupName: z.string().min(1),
  openTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format HH:MM'),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format HH:MM'),
});


export const InactivityConfigSchema = z.object({
  groupName: z.string().min(1),
  warnDays: z.string().regex(/^\d+$/, 'Days must be a positive integer'),
  banDays: z.string().regex(/^\d+$/, 'Days must be a positive integer'),
});
export type ConfigInput = z.infer<typeof ConfigSchema>;
