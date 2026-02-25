const corners = {
  tl: ['╔', '┌', '╭', '▛', '◤', '⌐'],
  tr: ['╗', '┐', '╮', '▜', '◥', '¬'],
  bl: ['╚', '└', '╰', '▙', '◣', 'L'],
  br: ['╝', '┘', '╯', '▟', '◢', 'J'],
};

const fills = {
  h: ['═', '─', '▀', '▄', '┅', '╌', '▬'],
};

const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const randomVariation = (message: string): string => {
  const lines = message.split('\n');
  const width = Math.max(...lines.map(l => l.length));

  const bar = Array.from({ length: width + 2 }, () => random(fills.h)).join('');

  const top = `${random(corners.tl)}${bar}${random(corners.tr)}`;
  const bottom = `${random(corners.bl)}${bar}${random(corners.br)}`;

  return `${top}\n${message}\n${bottom}`;
};