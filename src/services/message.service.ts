import { Logger } from 'winston';
import { ValidationError } from '@/lib/errors';
import { WhatsappClient } from '@/clients/whatsapp.client';
import { env } from '@/config/env';

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
    if(env.ENVIRONMENT === 'development') {
      this.logger.info('Service: Sending message', { senderId, text });
      return;
    }
    await this.whatsappClient.sendMessage(senderId, text);
  }
}
