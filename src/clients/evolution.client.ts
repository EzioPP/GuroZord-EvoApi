import logger from '@/lib/logger';
import { WhatsappClient } from './whatsapp.client';
import { generateDelay } from '@/lib/delay';
import { randomVariation } from '@/lib/message-variation';
export class EvolutionClient implements WhatsappClient {
  private readonly baseUrl: string;
  private readonly instance: string;
  private readonly apiKey: string;

  constructor(
    baseUrl: string = process.env.EVOLUTION_API_URL ?? 'http://localhost:8081',
    instance: string = process.env.EVOLUTION_INSTANCE ?? 'gurozord',
    apiKey: string = process.env.AUTHENTICATION_API_KEY!,
  ) {
    this.baseUrl = baseUrl;
    this.instance = instance;
    this.apiKey = apiKey;
  }

  async sendMessage(to: string, message: string): Promise<void> {
    const delay = generateDelay(1, 3);

    const body = {
      number: to,
      text: randomVariation(message),
      delay: delay,
    };

    logger.info('Sending message via Evolution API', { to, message, delay });
    const response = await fetch(`${this.baseUrl}/message/sendText/${this.instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: this.apiKey,
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    logger.info('Evolution API response', {
      status: response.status,
      statusText: response.statusText,
      body: responseText,
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.status} - ${responseText}`);
    }
  }

  async closeGroup(groupId: string): Promise<void> {
    logger.info('Closing group via Evolution API', { groupId });

    const response = await fetch(
      `${this.baseUrl}/group/updateSetting/${this.instance}?groupJid=${groupId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.apiKey,
        },
        body: JSON.stringify({ action: 'announcement' }),
      },
    );

    const responseText = await response.text();
    logger.info('Evolution API closeGroup response', {
      status: response.status,
      body: responseText,
    });

    if (!response.ok) {
      throw new Error(`Failed to close group: ${response.status} - ${responseText}`);
    }
  }

async findGroupParticipants(groupJid: string): Promise<{ whatsappId: string; lid?: string; role: 'admin' | 'superadmin' | null }[]> {
  logger.info('Fetching group participants from Evolution API', { groupJid });

  const response = await fetch(
    `${this.baseUrl}/group/participants/${this.instance}?groupJid=${groupJid}`,
    {
      method: 'GET',
      headers: { apikey: this.apiKey },
    },
  );

  const responseText = await response.text();
  logger.info('Evolution API findGroupParticipants response', {
    status: response.status,
    body: responseText,
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch participants: ${response.status} - ${responseText}`);
  }

  const data = JSON.parse(responseText);
return data.participants.map((p: any) => ({
  whatsappId: p.phoneNumber,
  lid: p.id ?? undefined,
  role: p.admin ?? null,
}));
}
  async openGroup(groupId: string): Promise<void> {
    logger.info('Opening group via Evolution API', { groupId });

    const response = await fetch(
      `${this.baseUrl}/group/updateSetting/${this.instance}?groupJid=${groupId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.apiKey,
        },
        body: JSON.stringify({ action: 'not_announcement' }),
      },
    );

    const responseText = await response.text();
    logger.info('Evolution API openGroup response', {
      status: response.status,
      body: responseText,
    });

    if (!response.ok) {
      throw new Error(`Failed to open group: ${response.status} - ${responseText}`);
    }
  }

  async findGroups(): Promise<{ whatsappId: string; name: string;}[]> {
    logger.info('Fetching groups from Evolution API');

    const response = await fetch(
      `${this.baseUrl}/group/fetchAllGroups/${this.instance}?getParticipants=false`,
      {
        method: 'GET',
        headers: {
          apikey: this.apiKey,
        },
      },
    );

    const responseText = await response.text();
    logger.info('Evolution API findGroups response', {
      status: response.status,
      body: responseText,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch groups: ${response.status} - ${responseText}`);
    }

    const groups = JSON.parse(responseText);
    return groups.map((group: any) => ({
      whatsappId: group.id,
      name: group.subject,
    }));
  }

  async fetchUserInfo(whatsappId: string): Promise<{ whatsappId: string; name: string } | null> {
    logger.info('Fetching user info from Evolution API', { whatsappId });
    const response = await fetch(`${this.baseUrl}/chat/findContacts/${this.instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: this.apiKey,
      },
      body: JSON.stringify({
        where: {
          id: whatsappId,
        },
      }),
    });

    const responseText = await response.text();
    logger.info('Evolution API fetchUserInfo response', {
      status: response.status,
      body: responseText,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.status} - ${responseText}`);
    }

    const contacts = JSON.parse(responseText);
    if (contacts.length === 0) {
      return null;
    }
    const contact = contacts[0];
    return {
      whatsappId: contact.id,
      name: contact.name,
    };
  }
}
