import { Logger } from 'winston';
import { ValidationError } from '@/lib/errors';
import { WhatsappClient } from '@/clients/whatsapp.client';

export class MessageService {
  constructor(
    private whatsappClient: WhatsappClient,
    private logger: Logger,
  ) {}

  async handleIncoming(senderId: string, text: string) {
    if (!senderId) {
      throw new ValidationError('Sender ID is required', { senderId });
    }

    this.logger.info('Service: Handling incoming message', { senderId, text });

    if (text === 'hello') {
      await this.whatsappClient.sendMessage(senderId, 'world');
    }
  }

  async sendMessage(senderId: string, text: string) {
    await this.whatsappClient.sendMessage(senderId, text);
  }
}
