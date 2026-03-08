// whatsapp.client.ts
import logger from '@/lib/logger';
import { WhatsappGroupParticipant } from '../types/whatsapp.types';

export interface WhatsappClient {
  sendMessage(to: string, message: string): Promise<void>;
  closeGroup(groupWhatsappId: string): Promise<void>;
  openGroup(groupWhatsappId: string): Promise<void>;
  findGroups(): Promise<{ whatsappId: string; name: string }[]>;
  fetchUserInfo(whatsappId: string): Promise<{ whatsappId: string; name: string } | null>;
  findGroupParticipants(groupJid: string): Promise<WhatsappGroupParticipant[]>;
  banFromGroup(groupWhatsappId: string, memberWhatsappNumbers: string[]): Promise<void>;
}

export class NoopWhatsappClient implements WhatsappClient {
  constructor(private readonly readOnlyClient?: Pick<WhatsappClient, 'findGroups' | 'fetchUserInfo' | 'findGroupParticipants'>) {}

  async sendMessage(to: string, message: string): Promise<void> {
    logger.info('[NoopClient] sendMessage', { to, message });
  }
  async closeGroup(groupWhatsappId: string): Promise<void> {
    logger.info('[NoopClient] closeGroup', { groupWhatsappId });
  }
  async openGroup(groupWhatsappId: string): Promise<void> {
    logger.info('[NoopClient] openGroup', { groupWhatsappId });
  }
  async findGroups(): Promise<{ whatsappId: string; name: string }[]> {
    if (this.readOnlyClient) {
      logger.info('[NoopClient] findGroups delegating to read-only client');
      return await this.readOnlyClient.findGroups();
    }

    logger.info('[NoopClient] findGroups');
    return [];
  }
  async fetchUserInfo(whatsappId: string): Promise<{ whatsappId: string; name: string } | null> {
    if (this.readOnlyClient) {
      logger.info('[NoopClient] fetchUserInfo delegating to read-only client', { whatsappId });
      return await this.readOnlyClient.fetchUserInfo(whatsappId);
    }

    logger.info('[NoopClient] fetchUserInfo', { whatsappId });
    return null;
  }
  async findGroupParticipants(groupJid: string): Promise<WhatsappGroupParticipant[]> {
    if (this.readOnlyClient) {
      logger.info('[NoopClient] findGroupParticipants delegating to read-only client', { groupJid });
      return await this.readOnlyClient.findGroupParticipants(groupJid);
    }

    logger.info('[NoopClient] findGroupParticipants', { groupJid });
    return [];
  }
  async banFromGroup(groupWhatsappId: string, memberWhatsappNumbers: string[]): Promise<void> {
    logger.info('[NoopClient] banFromGroup', { groupWhatsappId, memberWhatsappNumbers });
  }
}