// whatsapp.client.ts
export interface WhatsappClient {
  sendMessage(to: string, message: string): Promise<void>;
  closeGroup(groupWhatsappId: string): Promise<void>;
  openGroup(groupWhatsappId: string): Promise<void>;
  findGroups(): Promise<{ whatsappId: string; name: string }[]>;
  fetchUserInfo(whatsappId: string): Promise<{ whatsappId: string; name: string } | null>;
  findGroupParticipants(groupJid: string): Promise<{ whatsappId: string; lid?: string; role: 'admin' | 'superadmin' | null }[]>;
  banFromGroup(groupWhatsappId: string, memberWhatsappNumbers: string[]): Promise<void>;
}