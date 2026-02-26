const circles = ['○', '◯', '●', '◉', '◦', '•'];
const random = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

export const randomVariation = (message: string): string => {
  const bar = Array.from({ length: 6 }, () => random(circles)).join('');
  const top = `╭${bar}╮`;
  return `${top}\n${message}`;
};