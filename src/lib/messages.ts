// src/lib/messages.ts

export const Messages = {
  welcome: {
    rules: `🚫 PROIBIDO brigas.
🚫 PROIBIDO divulgação de links ou outras streaming.
🚫 PROIBIDO chamar no pv outras integrantes sem o consentimento dela ou para ofendê-la.
🚫 PROIBIDO mandar fotos normais, apenas em VISUALIZAÇÃO ÚNICA.
🚫 PROIBIDO enviar figurinhas, fotos ou qualquer conteúdo com nudez/teor explícito.
✅ O grupo será fechado às 01h e aberto às 10h.
✅ PERMITIDO muita fofoca.

🚨 QUEM QUEBRAR ALGUMA REGRA, SERÁ REMOVIDO SEM AVISO PRÉVIO.
🎀 Aqui é um grupo para vocês virarem amigas, pedir conselhos, opiniões, se divertir e falar sobre meu conteúdo.`,

    single: () => `Seja bem-vinda! 🎀\n\n${Messages.welcome.rules}`,
    batch: (mentions: string[]) =>
      `Sejam bem-vindas, ${mentions.map((p) => `@${p}`).join(', ')}! 🎀\n\n${Messages.welcome.rules}`,
  },

  sync: {
    failed: 'Failed to synchronize groups. Please try again later.',
  },

  top: {
    empty: 'Nenhum membro ativo ainda! 😴',
    medals: ['🥇', '🥈', '🥉'] as const,
    emojis: ['💕', '🌷', '💖', '✨', '💎', '💄', '🦋', '🌹', '💫', '👑'] as const,
    ordinals: ['1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º', '9º', '10º'] as const,
    build: (members: { whatsappNumber: string; messageCount: number }[]): string => {
      const lines = members.map((m, i) => {
        const medal = i < 3 ? `${Messages.top.medals[i]} ` : '';
        const emoji = Messages.top.emojis[i];
        const ordinal = Messages.top.ordinals[i];
        return `${medal}${ordinal} – ${m.whatsappNumber} ${emoji} (${m.messageCount} mensagens)`;
      });

      return [
        '🎀✨ TOP 10 – As Mais Ativas do Grupo ✨🎀',
        '🌸 Atualização da Semana 🌸',
        '',
        ...lines,
        '',
        '💌 Continue participando para subir no ranking!',
        '👑 As mais ativas sempre têm destaque especial no grupo!',
      ].join('\n');
    },
  },
};