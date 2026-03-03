import { Logger } from 'winston';
import { GroupRepository, GroupConfigRepository } from '@/persistence';

export const DEFAULT_TEMPLATES: Record<string, string> = {
  msg_welcome_rules: [
    'Regras do grupo:',
    '- Respeite todos os membros.',
    '- Proibido spam e propaganda.',
    '- Proibido conteúdo impróprio.',
    '- Siga as orientações dos administradores.',
    '',
    'Quem descumprir será removido.',
  ].join('\n'),
  msg_welcome_single: 'Bem-vindo(a) ao grupo!\n\n{rules}',
  msg_welcome_batch: 'Bem-vindos(as), {mentions}!\n\n{rules}',

  msg_top_empty: 'Nenhum membro ativo ainda.',
  msg_top_header: 'TOP 10 - Membros Mais Ativos',
  msg_top_subheader: 'Ranking da Semana',
  msg_top_subheader_week: 'Ranking da Semana',
  msg_top_subheader_month: 'Ranking do Mês',
  msg_top_subheader_alltime: 'Ranking Geral',
  msg_top_line: '{medal}{ordinal} – {number}{emoji} ({count} mensagens)',
  msg_top_footer: 'Continue participando para subir no ranking!',
  msg_top_medals: JSON.stringify(['🥇', '🥈', '🥉']),
  msg_top_emojis: JSON.stringify(['', '', '', '', '', '', '', '', '', '']),
  msg_top_ordinals: JSON.stringify([
    '1º',
    '2º',
    '3º',
    '4º',
    '5º',
    '6º',
    '7º',
    '8º',
    '9º',
    '10º',
  ]),

  msg_inactive_warning_header: '⚠️ Membros inativos ({days}+ dias):',
  msg_inactive_warning_line: '@{number} - Última mensagem: {lastMessage}',
  msg_inactive_warning_footer: 'Permaneça ativo(a) para evitar remoção do grupo.',
  msg_inactive_warning_never: 'Nunca',
};



export const FANCY_PRESET: Record<string, string> = {
  msg_welcome_rules: [
    '🚫 PROIBIDO brigas.',
    '🚫 PROIBIDO divulgação de links ou outras streaming.',
    '🚫 PROIBIDO chamar no pv outras integrantes sem o consentimento dela ou para ofendê-la.',
    '🚫 PROIBIDO mandar fotos normais, apenas em VISUALIZAÇÃO ÚNICA.',
    '🚫 PROIBIDO enviar figurinhas, fotos ou qualquer conteúdo com nudez/teor explícito.',
    '✅ O grupo será fechado às 01h e aberto às 10h.',
    '✅ PERMITIDO muita fofoca.',
    '',
    '🚨 QUEM QUEBRAR ALGUMA REGRA, SERÁ REMOVIDO SEM AVISO PRÉVIO.',
    '🎀 Aqui é um grupo para vocês virarem amigas, pedir conselhos, opiniões, se divertir e falar sobre meu conteúdo.',
  ].join('\n'),
  msg_welcome_single: 'Seja bem-vinda! 🎀\n\n{rules}',
  msg_welcome_batch: 'Sejam bem-vindas, {mentions}! 🎀\n\n{rules}',

  msg_top_empty: 'Nenhum membro ativo ainda! 😴',
  msg_top_header: '🎀✨ TOP 10 – As Mais Ativas do Grupo ✨🎀',
  msg_top_subheader: '🌸 Atualização da Semana 🌸',
  msg_top_subheader_week: '🌸 Ranking da Semana 🌸',
  msg_top_subheader_month: '🌸 Ranking do Mês 🌸',
  msg_top_subheader_alltime: '🌸 Ranking Geral 🌸',
  msg_top_line: '{medal}{ordinal} – {number}{emoji} ({count} mensagens)',
  msg_top_footer: [
    '💌 Continue participando para subir no ranking!',
    '👑 As mais ativas sempre têm destaque especial no grupo!',
  ].join('\n'),
  msg_top_medals: JSON.stringify(['🥇', '🥈', '🥉']),
  msg_top_emojis: JSON.stringify(['💕', '🌷', '💖', '✨', '💎', '💄', '🦋', '🌹', '💫', '👑']),
  msg_top_ordinals: JSON.stringify([
    '1º',
    '2º',
    '3º',
    '4º',
    '5º',
    '6º',
    '7º',
    '8º',
    '9º',
    '10º',
  ]),

  msg_inactive_warning_header: '⚠️💤 Inativas há {days}+ dias:',
  msg_inactive_warning_line: '🌸 @{number} - última msg: {lastMessage}',
  msg_inactive_warning_footer: '💌 Participem para evitar remoção automática.',
  msg_inactive_warning_never: 'Nunca',
};

export class MessageTemplateService {
  constructor(
    private groupRepository: GroupRepository,
    private groupConfigRepository: GroupConfigRepository,
    private logger: Logger,
  ) {}

  private async loadTemplates(groupId: number): Promise<Record<string, string>> {
    const dbTemplates = await this.groupConfigRepository.getMessageTemplates(groupId);
    return { ...DEFAULT_TEMPLATES, ...dbTemplates };
  }

  private async resolveGroupId(groupWhatsappId: string): Promise<number> {
    const group = await this.groupRepository.getGroupByWhatsappId(groupWhatsappId);
    return group.groupId;
  }

  async buildWelcomeMessage(groupWhatsappId: string, phones: string[]): Promise<string> {
    const groupId = await this.resolveGroupId(groupWhatsappId);
    const t = await this.loadTemplates(groupId);
    const rules = t.msg_welcome_rules;

    if (phones.length === 1) {
      return t.msg_welcome_single.replace('{rules}', rules);
    }

    const mentions = phones.map((p) => `@${p}`).join(', ');
    return t.msg_welcome_batch.replace('{mentions}', mentions).replace('{rules}', rules);
  }

  async buildTopMessage(
    groupWhatsappId: string,
    members: { whatsappNumber: string; messageCount: number }[],
    periodType: 'week' | 'month' | 'all-time' = 'week',
  ): Promise<string> {
    const groupId = await this.resolveGroupId(groupWhatsappId);
    const t = await this.loadTemplates(groupId);

    if (members.length === 0) {
      return t.msg_top_empty;
    }

    const medals: string[] = JSON.parse(t.msg_top_medals);
    const emojis: string[] = JSON.parse(t.msg_top_emojis);
    const ordinals: string[] = JSON.parse(t.msg_top_ordinals);

    const lines = members.map((m, i) => {
      const medal = i < medals.length ? `${medals[i]} ` : '';
      const emoji = emojis[i] ? ` ${emojis[i]}` : '';
      const ordinal = ordinals[i] ?? `${i + 1}º`;
      return t.msg_top_line
        .replace('{medal}', medal)
        .replace('{ordinal}', ordinal)
        .replace('{number}', m.whatsappNumber)
        .replace('{emoji}', emoji)
        .replace('{count}', String(m.messageCount));
    });

    // Determine subheader based on period
    let subheader = t.msg_top_subheader;
    if (periodType === 'week') {
      subheader = t.msg_top_subheader_week ?? 'Ranking da Semana';
    } else if (periodType === 'month') {
      subheader = t.msg_top_subheader_month ?? 'Ranking do Mês';
    } else if (periodType === 'all-time') {
      subheader = t.msg_top_subheader_alltime ?? 'Ranking Geral';
    }

    return [t.msg_top_header, subheader, '', ...lines, '', t.msg_top_footer].join('\n');
  }

  async buildInactivityWarningMessage(
    groupWhatsappId: string,
    warningDays: number,
    members: { whatsappNumber: string; dtLastMessage: Date | null }[],
  ): Promise<string> {
    const groupId = await this.resolveGroupId(groupWhatsappId);
    const t = await this.loadTemplates(groupId);

    const lines = members.map((member) => {
      const lastMessage = member.dtLastMessage?.toISOString() ?? t.msg_inactive_warning_never;
      return t.msg_inactive_warning_line
        .replace('{number}', member.whatsappNumber)
        .replace('{lastMessage}', lastMessage);
    });

    return [
      t.msg_inactive_warning_header.replace('{days}', String(warningDays)),
      ...lines,
      t.msg_inactive_warning_footer,
    ].join('\n');
  }

  /**
   * Apply a named preset to a specific group.
   * Example: `applyPreset('12345@g.us', FANCY_PRESET)`
   */
  async applyPreset(groupWhatsappId: string, preset: Record<string, string>): Promise<void> {
    const groupId = await this.resolveGroupId(groupWhatsappId);
    this.logger.info('Applying message preset to group', { groupId });
    for (const [key, value] of Object.entries(preset)) {
      await this.groupConfigRepository.upsertConfig(groupId, key, value);
    }
  }
}
