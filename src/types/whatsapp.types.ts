export type WhatsappGroupParticipant = {
  whatsappId: string;
  lid?: string;
  name?: string;
  role: 'admin' | 'superadmin' | null;
};