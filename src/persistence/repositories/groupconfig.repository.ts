import { PrismaClient } from '@@/generated/prisma/client';
import logger from '@/lib/logger';
import { ErrorHandler } from '@/lib/error-handler';

export class GroupConfigRepository {
  constructor(private prisma: PrismaClient) {}

  async upsertConfig(groupId: number, key: string, value: string, language: string = 'pt-br') {
    try {
      logger.debug('Repository: Upserting group config', { groupId, key });
      return await this.prisma.groupConfig.upsert({
        where: { groupId_key_language: { groupId, key, language } },
        update: { value },
        create: { groupId, key, value, language },
      });
    } catch (error) {
      throw ErrorHandler.handle(error, logger, { operation: 'upsertConfig', groupId, key });
    }
  }

  async getConfig(groupId: number, key: string, language: string = 'pt-br') {
    try {
      logger.debug('Repository: Fetching group config', { groupId, key });
      return await this.prisma.groupConfig.findUnique({
        where: { groupId_key_language: { groupId, key, language } },
      });
    } catch (error) {
      throw ErrorHandler.handle(error, logger, { operation: 'getConfig', groupId, key });
    }
  }

  async getAllConfigsForGroup(groupId: number) {
    try {
      logger.debug('Repository: Fetching all configs for group', { groupId });
      return await this.prisma.groupConfig.findMany({ where: { groupId } });
    } catch (error) {
      throw ErrorHandler.handle(error, logger, { operation: 'getAllConfigsForGroup', groupId });
    }
  }

  async getConfigWithDefault(
    groupId: number,
    key: string,
    defaultValue: string,
    language: string = 'pt-br',
  ): Promise<{ key: string; value: string; language: string }> {
    try {
      logger.debug('Repository: Fetching config with default fallback', { groupId, key });
      const config = await this.prisma.groupConfig.findUnique({
        where: { groupId_key_language: { groupId, key, language } },
      });
      if (config) return { key: config.key, value: config.value, language: config.language };
      // Fallback to default (groupId = null)
      const defaultConfig = await this.prisma.groupConfig.findFirst({
        where: { groupId: null, key, language },
      });
      if (defaultConfig)
        return { key: defaultConfig.key, value: defaultConfig.value, language: defaultConfig.language };
      return { key, value: defaultValue, language };
    } catch (error) {
      throw ErrorHandler.handle(error, logger, { operation: 'getConfigWithDefault', groupId, key });
    }
  }

  /**
   * Load all message templates (msg_* keys) for a group.
   * Merges global defaults (groupId = null) with group-specific overrides.
   */
  async getMessageTemplates(groupId: number): Promise<Record<string, string>> {
    try {
      logger.debug('Repository: Fetching message templates', { groupId });
      const [defaultConfigs, groupConfigs] = await Promise.all([
        this.prisma.groupConfig.findMany({
          where: { groupId: null, key: { startsWith: 'msg_' } },
        }),
        this.prisma.groupConfig.findMany({
          where: { groupId, key: { startsWith: 'msg_' } },
        }),
      ]);
      const result: Record<string, string> = {};
      for (const c of defaultConfigs) result[c.key] = c.value;
      for (const c of groupConfigs) result[c.key] = c.value; // group overrides defaults
      return result;
    } catch (error) {
      throw ErrorHandler.handle(error, logger, { operation: 'getMessageTemplates', groupId });
    }
  }
}
